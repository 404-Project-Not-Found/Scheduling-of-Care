export type Role = 'carer' | 'management' | 'family';

export async function signUpUser(
    fullName: string,
    email: string,
    password: string,
    confirm: string,
    role: Role)
{
    // Ensure the password created matches
    if(password !== confirm){
        throw new Error("Passwords do not match");
    }

    // Make a POST request to the signup API endpoint
    const res = await fetch("/api/signup", 
        {method: "POST", 
        headers: {"Content-Type": "application/json"}, 
        body: JSON.stringify({fullName, email, password, role})
    });

    // Parse the JSON response
    const data = await res.json();

    // The response is not ok, sign up failed
    if(!res.ok){
        throw new Error(data.error || "Sign up failed");
    }

    // Server response if sign up is successful
    return data;

}