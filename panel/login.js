const current_url = "http://127.0.0.1";

document.getElementById("login-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch(`${current_url}/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: username, password: password })
        });

        if (response.ok) {
            console.log("Login successful");
            window.location.href = 'admin_panel.html';
        } else {
            console.error("Login failed");
        }
    } catch (error) {
        console.error("Error:", error);
    }
});

