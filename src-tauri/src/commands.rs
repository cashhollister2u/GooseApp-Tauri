// commands.rs
use serde::{Deserialize, Serialize};
use rsa::{Pkcs1v15Encrypt, RsaPrivateKey, RsaPublicKey};
use rsa::{pkcs8::{DecodePrivateKey, DecodePublicKey}};
use rand::rngs::OsRng;
use base64::prelude::*;
use rayon::prelude::*;
use std::sync::Arc;


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
    decrypted_message: Option<String>, 

}

#[tauri::command]
pub fn pull_messages_encrypted(messages: Vec<Message>, username: String, private_key: String, reciever_username: String) -> Result<Vec<Message>, String> {
    let key = match RsaPrivateKey::from_pkcs8_pem(&private_key) {
        Ok(k) => Arc::new(k), 
        Err(e) => return Err(e.to_string()),
    };

    // Step 3: Decrypt messages within the specified range
    let decrypted_messages: Result<Vec<_>, _> = messages.into_par_iter()
        .map(|mut message| {
            let encrypted_data = if message.sender_profile.username == username {
                &message.sender_message
            } else {
                &message.message
            };
            // Attempt to base64 decode the message
            let base64_decode = BASE64_STANDARD.decode(encrypted_data).map_err(|e| e.to_string())?;
            let key_clone = Arc::clone(&key);
            // Decrypt the data using the RSA private key
            let decrypted_data = key_clone.decrypt(Pkcs1v15Encrypt, &base64_decode).map_err(|e| e.to_string())?;
            // Attempt to convert the decrypted data to a String
            let decrypted_message = String::from_utf8(decrypted_data).map_err(|e| e.to_string())?;

            message.decrypted_message = Some(decrypted_message);
            
            Ok(message)
        })
        .collect();

    decrypted_messages
}

#[tauri::command]
pub fn pull_message_to_encrypt(message: String, public_key: String) -> Result<String, String> {
    let mut rng = OsRng;
    let key = RsaPublicKey::from_public_key_pem(&public_key).unwrap();
    // Encrypt
    let data = message.as_bytes();
    match key.encrypt(&mut rng, Pkcs1v15Encrypt, &data[..]) {
        Ok(encrypted_data) => {
            let base64_enc = BASE64_STANDARD.encode(encrypted_data);
           
            Ok(base64_enc) // Return the base64-encoded encrypted data to next.js
        },
        Err(e) => {
          
            Err(format!("Encryption failed: {:?}", e))
        },
    }   
}

#[tauri::command]
pub fn pull_message_to_decrypt(message: String, private_key: String) -> Result<String, String> {
    let key = match RsaPrivateKey::from_pkcs8_pem(&private_key) {
        Ok(k) => k,
        Err(e) => return Err(format!("Failed to parse private key: {:?}", e)),
    };
    
    // Attempt to base64 decode the message
    let base64_decode = match BASE64_STANDARD.decode(&message) {
        Ok(d) => d,
        Err(e) => return Err(format!("Base64 decode error: {:?}", e)),
    };

    // Decrypt the data
    match key.decrypt(Pkcs1v15Encrypt, &base64_decode) {
        Ok(decrypted_data) => {
            // Attempt to convert the decrypted data to a String
            match String::from_utf8(decrypted_data) {
                Ok(decrypted_message) => {
                   
                    Ok(decrypted_message) // Successfully return the decrypted message
                },
                Err(e) => Err(format!("Failed to convert decrypted data to string: {:?}", e)),
            }
        },
        Err(e) => {
          
            Err(format!("Decryption failed: {:?}", e))
        },
    }
}

