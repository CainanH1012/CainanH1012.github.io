def test_index(client):
    rv = client.get('/')
    assert rv.status_code == 200
    assert b'PGN: Underground CAD System' in rv.data

def test_login(client):
    rv = client.get('/login/')
    assert rv.status_code == 302  # Redirect to Discord login
