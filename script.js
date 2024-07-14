document.addEventListener('DOMContentLoaded', function() {
    const tabs = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-pane');
    const interviewForm = document.querySelector('form#interview-form');
    const interviewList = document.getElementById('interview-list');
    const searchInput = document.getElementById('search');
    const dobInput = document.getElementById('dob');
    const calculatedAgeSpan = document.getElementById('calculatedAge');
    const popup = document.getElementById('popup');
    const popupDetails = document.getElementById('popup-details');
    const closePopup = document.querySelector('.close');

    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

    // Calculate age based on birthdate
    if (dobInput && calculatedAgeSpan) {
        dobInput.addEventListener('change', function() {
            const dob = new Date(this.value);
            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            const monthDiff = today.getMonth() - dob.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                age--;
            }

            calculatedAgeSpan.textContent = `Age: ${age}`;
        });
    }

    // Form submission
    if (interviewForm) {
        interviewForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Prevent the default form submission

            // Gather form data
            const formData = new FormData(interviewForm);
            const interviewData = Object.fromEntries(formData.entries());

            // Add current date and time
            interviewData.dateTime = new Date().toISOString();

            // Save interview data
            let interviews = JSON.parse(localStorage.getItem('interviews')) || [];
            interviews.push(interviewData);
            localStorage.setItem('interviews', JSON.stringify(interviews));

            alert('Interview submitted successfully!');
            this.reset();
            calculatedAgeSpan.textContent = ''; // Clear the calculated age
            updateInterviewList();
        });
    }

    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', updateInterviewList);
    }

    function updateInterviewList() {
        const interviews = JSON.parse(localStorage.getItem('interviews')) || [];
        const searchTerm = searchInput.value.toLowerCase();

        interviewList.innerHTML = '';

        interviews.forEach((interview) => {
            if (interview.discord && interview.discordId &&
                (interview.discord.toLowerCase().includes(searchTerm) || 
                 interview.discordId.includes(searchTerm))) {
                const item = document.createElement('div');
                item.classList.add('interview-item');
                item.textContent = `${interview.discord} (${interview.discordId})`;
                
                item.addEventListener('click', () => showInterviewDetails(interview));
                interviewList.appendChild(item);
            }
        });
    }

    function archiveInterview(discordId) {
        let interviews = JSON.parse(localStorage.getItem('interviews')) || [];

        const interviewToArchive = interviews.find(interview => interview.discordId === discordId);
        if (interviewToArchive) {
            interviews = interviews.filter(interview => interview.discordId !== discordId);

            localStorage.setItem('interviews', JSON.stringify(interviews));

            updateInterviewList();
        }
    }

    function showInterviewDetails(interview) {
        popupDetails.innerHTML = '';

        const dateTime = new Date(interview.dateTime).toLocaleString();
        const dateDiv = document.createElement('div');
        dateDiv.innerHTML = `<strong>Interview Date & Time:</strong> ${dateTime}`;
        popupDetails.appendChild(dateDiv);

        const categories = [
            { name: "Canedit Information", fields: ["discord", "discordId"] },
            { name: "Preliminary Questions", fields: ["age", "dob", "experience", "chooseReason", "aboutYourself"] },
            { name: "Staffing Knowledge Questions", fields: ["chainOfCommand", "invisibleStaffing", "conflictOfInterest", "professionalism", "staffPositionReason", "availableHours", "standOut", "strengthsWeaknesses"] },
            { name: "Staffing Clips", fields: ["clip1", "clip2"] },
            { name: "Scenario Based Questions", fields: ["scenario1", "scenario2", "scenario3", "scenario4", "scenario5"] },
            { name: "Pass or Fail", fields: ["passFail"] }
        ];

        const questionLabels = {
            discord: "Canedit Discord",
            discordId: "Discord ID",
            age: "Q1a. How old are you?",
            dob: "Q1b. What's your Date of Birth?",
            experience: "Q2. Do you have any other Public Server Staff Experience?",
            chooseReason: "Q3. What made you choose ProGamerNetwork?",
            aboutYourself: "Q4. Tell me more about yourself.",
            chainOfCommand: "Q4. Do you understand what chain of command is? Describe it in your own words",
            invisibleStaffing: "Q5. Do you know what invisible staffing is, if so explain?",
            conflictOfInterest: "Q6. What is a conflict of interest?",
            professionalism: "Q7. What are some examples of being professional at all times?",
            staffPositionReason: "Q8. Why do you want a Staff position?",
            availableHours: "Q9. How many hours a week are you available to dedicate to PGN?",
            standOut: "Q10. What makes you stand out for the PGN Underground Staff Team?",
            strengthsWeaknesses: "Q11. What are some of your strengths and weaknesses?",
            clip1: "Clip 1 Feedback",
            clip2: "Clip 2 Feedback",
            scenario1: "Q1: You saw your friend get killed by a random person for a valid reason, your friend then self revives and kills them back. What would you do?",
            scenario2: "Q2: You see someone driving around recklessly. They then drive into Sandy Shores and ram into a set of parked cars with no one inside of them at the 24/7. Did they break a rule? If yes, How would you punish them?",
            scenario3: "Q3: A new visitor is driving around and they have gotten a previous warning for RDM (Random Death Match) you then see the same person later on get into a traffic stop and instantly shoot the cop. What rule did they break, and how would you punish them?",
            scenario4: "Q4: Someone smashes their car at 100mph in a busy area and then they repair their car and drive off and you spot this, What would you do?",
            scenario5: "Q5: Player1 was threatening Player2 , but insisted it was part of a roleplay situation. However Player2 is insisting they are being harassed, neither of them are agreeing and are now starting to shout at each other. What would you do?",
            passFail: "Q1: Pass or Fail?"
        };

        categories.forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.innerHTML = `<h3>${category.name}</h3>`;
            
            category.fields.forEach(field => {
                if (interview[field]) {
                    const p = document.createElement('p');
                    p.innerHTML = `<strong>${questionLabels[field]}:</strong> ${interview[field]}`;
                    categoryDiv.appendChild(p);
                }
            });

            popupDetails.appendChild(categoryDiv);
        });

        popup.style.display = 'block';
    }

    closePopup.addEventListener('click', () => {
        popup.style.display = 'none';
    });

    updateInterviewList();
});
