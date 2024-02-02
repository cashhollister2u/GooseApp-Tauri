// commands.rs
use serde::{Deserialize, Serialize};
use rsa::{Pkcs1v15Encrypt, RsaPrivateKey, RsaPublicKey};
use rsa::{
    pkcs1v15,
    pkcs8::{DecodePrivateKey, DecodePublicKey, EncodePrivateKey, EncodePublicKey},
    traits::{PrivateKeyParts, PublicKeyParts},  
};
use rand::rngs::OsRng;
use rand::RngCore;
use base64;


#[cfg(feature = "pem")]
use rsa::pkcs8::LineEnding;


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
pub fn pull_messages_encrypted(messages: Vec<Message>, username: String, private_key: String) -> String {
    for message in messages {
        if message.sender_profile.username == username {
            println!("User username: {:?}", username);
            println!("User sent message: {:?}\n", message.sender_message);
        }
        else {
            println!("Received username: {:?}", message.sender_profile.username);
            println!("Received message: {:?}\n", message.message); 
        }
    }

    "Messages processed successfully".to_string()
}

#[tauri::command]
pub fn pull_message_to_encrypt(message: String, public_key: String) -> Result<String, String> {
    let mut rng = OsRng;
    let key = RsaPublicKey::from_public_key_pem(&public_key).unwrap();
    // Encrypt
    let data = message.as_bytes();
    match key.encrypt(&mut rng, Pkcs1v15Encrypt, &data[..]) {
        Ok(encrypted_data) => {
            let base64_enc = base64::encode(encrypted_data);
            println!("Data encoded to base64: {:?}", base64_enc);
            Ok(base64_enc) // Return the base64-encoded encrypted data
        },
        Err(e) => {
            println!("Encryption failed: {:?}", e);
            Err(format!("Encryption failed: {:?}", e))
        },
    }

   
    
    //return info to next.js
    
}

