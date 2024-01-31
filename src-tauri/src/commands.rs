// commands.rs
use serde::{Deserialize, Serialize};



#[derive(Serialize, Deserialize, Debug)]
struct Profile {
    username: String,
    public_key: String,
    full_name: String,
    profile_picture: String,
    verified: bool,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Message {
    date: String,
    id: i32,
    is_read: bool,
    message: String,
    reciever: i32,
    reciever_profile: Profile,
    sender: i32,
    sender_message: String,
    sender_profile: Profile,
    user: i32,
}

#[tauri::command]
pub fn my_rust_function(messages: Vec<Message>) -> String {
    // Process the messages here
    // For example, just print them and return a confirmation message
    for message in messages {
        println!("Received message: {:?}", message);
    }

    "Messages processed successfully".to_string()
}
