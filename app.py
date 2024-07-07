from flask import Flask, render_template, redirect, url_for, session, request, jsonify
from flask_discord import DiscordOAuth2Session, requires_authorization, Unauthorized
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO
from datetime import datetime

app = Flask(__name__)
app.config.from_object('config.Config')

db = SQLAlchemy(app)
discord = DiscordOAuth2Session(app)
socketio = SocketIO(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    discord_id = db.Column(db.String(30), unique=True, nullable=False)
    username = db.Column(db.String(30), nullable=False)
    role = db.Column(db.String(30), nullable=False, default='Member')
    department = db.Column(db.String(30), nullable=True)
    units = db.relationship('Unit', backref='user', lazy=True)

class Call(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    call_type = db.Column(db.String(50), nullable=False)
    location = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(200), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='Pending')
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

class Unit(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    call_id = db.Column(db.Integer, db.ForeignKey('call.id'), nullable=True)
    status = db.Column(db.String(20), nullable=False, default='Available')

class CallHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    call_id = db.Column(db.Integer, db.ForeignKey('call.id'), nullable=False)
    action = db.Column(db.String(100), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    details = db.Column(db.String(200), nullable=True)

@app.before_request
def before_request():
    if app.config.get('ENV', 'production') != 'testing' and not request.is_secure:
        url = request.url.replace("http://", "https://", 1)
        return redirect(url)

def log_call_action(call_id, action, details=""):
    log = CallHistory(call_id=call_id, action=action, details=details)
    db.session.add(log)
    db.session.commit()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/login/")
def login():
    return discord.create_session()

@app.route("/callback/")
def callback():
    discord.callback()
    user = discord.fetch_user()
    discord_user = User.query.filter_by(discord_id=user.id).first()

    if not discord_user:
        discord_user = User(discord_id=user.id, username=user.username)
        db.session.add(discord_user)
        db.session.commit()

    session["user"] = user
    return redirect(url_for("dashboard"))

@app.route("/dashboard/")
@requires_authorization
def dashboard():
    user = session["user"]
    return render_template("dashboard.html", user=user)

@app.route("/law-enforcement/")
@requires_authorization
def law_enforcement():
    user = session["user"]
    current_user = User.query.filter_by(discord_id=user.id).first()
    current_user.department = 'Law Enforcement'
    db.session.commit()
    return render_template("law_enforcement.html", user=current_user)

@app.route("/fire-department/")
@requires_authorization
def fire_department():
    user = session["user"]
    current_user = User.query.filter_by(discord_id=user.id).first()
    current_user.department = 'Fire Department'
    db.session.commit()
    return render_template("fire_department.html", user=current_user)

@app.route("/dispatch/")
@requires_authorization
def dispatch():
    user = session["user"]
    current_user = User.query.filter_by(discord_id=user.id).first()
    current_user.department = 'Dispatch'
    db.session.commit()
    return render_template("dispatch.html", user=current_user)

@app.route("/dispatch/create-call/", methods=["GET", "POST"])
@requires_authorization
def create_call():
    if request.method == "POST":
        call_type = request.form["call_type"]
        location = request.form["location"]
        description = request.form["description"]
        new_call = Call(call_type=call_type, location=location, description=description)
        db.session.add(new_call)
        db.session.commit()
        socketio.emit('new_call', {
            'id': new_call.id, 
            'call_type': call_type, 
            'location': location, 
            'description': description, 
            'status': new_call.status, 
            'timestamp': new_call.timestamp.strftime('%Y-%m-%d %H:%M:%S')
        })
        log_call_action(new_call.id, "Created Call", f"Call Type: {call_type}, Location: {location}")
        return redirect(url_for("dispatch"))

    return render_template("create_call.html")

@app.route("/dispatch/manage-calls/")
@requires_authorization
def manage_calls():
    calls = Call.query.all()
    units = Unit.query.all()
    return render_template("manage_calls.html", calls=calls, units=units)

@app.route("/calls/<int:call_id>/assign-unit/", methods=["POST"])
@requires_authorization
def assign_unit(call_id):
    unit_id = request.form["unit_id"]
    unit = Unit.query.get(unit_id)
    unit.call_id = call_id
    unit.status = "Assigned"
    db.session.commit()
    log_call_action(call_id, "Assigned Unit", f"Unit ID: {unit_id}")
    socketio.emit('unit_assigned', {'unit_id': unit.id, 'call_id': call_id})
    return redirect(url_for("manage_calls"))

@app.route("/calls/<int:call_id>/update-status/", methods=["POST"])
@requires_authorization
def update_call_status(call_id):
    status = request.form["status"]
    call = Call.query.get(call_id)
    call.status = status
    db.session.commit()
    log_call_action(call_id, "Updated Status", f"Status: {status}")
    socketio.emit('call_status_updated', {'call_id': call_id, 'status': status})
    return redirect(url_for("manage_calls"))

@app.route("/units/create/", methods=["GET", "POST"])
@requires_authorization
def create_unit():
    if request.method == "POST":
        user_id = session["user"].id
        new_unit = Unit(user_id=user_id)
        db.session.add(new_unit)
        db.session.commit()
        return redirect(url_for("manage_units"))

    return render_template("create_unit.html")

@app.route("/units/manage/")
@requires_authorization
def manage_units():
    user = session["user"]
    units = Unit.query.filter_by(user_id=user.id).all()
    return render_template("manage_units.html", units=units)

@app.route("/units/<int:unit_id>/update-status/", methods=["POST"])
@requires_authorization
def update_unit_status(unit_id):
    status = request.form["status"]
    unit = Unit.query.get(unit_id)
    unit.status = status
    db.session.commit()
    socketio.emit('unit_status_updated', {'unit_id': unit_id, 'status': status})
    return redirect(url_for("manage_units"))

@app.route("/units/<int:unit_id>/perform-action/", methods=["POST"])
@requires_authorization
def perform_unit_action(unit_id):
    action = request.form["action"]
    unit = Unit.query.get(unit_id)
    if action == "On Scene":
        unit.status = "On Scene"
    elif action == "Available":
        unit.status = "Available"
    db.session.commit()
    log_call_action(unit.call_id, "Performed Action", f"Action: {action}, Unit ID: {unit_id}")
    socketio.emit('unit_action_performed', {'unit_id': unit_id, 'action': action})
    return redirect(url_for("manage_units"))

@app.route("/call-history/")
@requires_authorization
def call_history():
    logs = CallHistory.query.order_by(CallHistory.timestamp.desc()).all()
    return render_template("call_history.html", logs=logs)

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@app.errorhandler(Unauthorized)
def redirect_unauthorized(e):
    return redirect(url_for("login"))

if __name__ == "__main__":
    db.create_all()
    socketio.run(app, debug=True)
