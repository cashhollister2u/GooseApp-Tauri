// commands.rs
use serde::{Deserialize, Serialize};
use tauri::Result as TauriResult;
use std::io::Write;
use std::os::unix::fs::PermissionsExt;
use std::io::{self, Read};
use rsa::{Pkcs1v15Encrypt, RsaPrivateKey, RsaPublicKey};
use rsa::{pkcs8::{DecodePrivateKey, DecodePublicKey}};
use rand::rngs::OsRng;
use base64::prelude::*;
use rayon::prelude::*;
use std::sync::Arc;
use std::fs::File;
use std::path::PathBuf;

//--encryption start--//

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
pub fn pull_messages_encrypted(messages: Vec<Message>, username: String, private_key: String) -> Result<Vec<Message>, String> {
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
//--encryption end--//


//saving private info to file 

#[derive(Serialize, Deserialize, Debug)]
struct PrivateData {
    priv_key: String,
}
#[tauri::command]
pub fn save_private_key_to_file(private_key: String, username: String) -> Result<(), String> {
    let path = format!("User_keys/{}_data.pem", username);
    
    let mut file = File::create(path)
        .map_err(|e| format!("Failed to create file: {}", e))?;
    file.write_all(private_key.as_bytes())
        .map_err(|e| format!("Failed to write to file: {}", e))?;
        
    // Set file permissions to owner read/write (600) on Unix-based systems
    #[cfg(unix)]
    {
        use std::fs;

        let metadata = file.metadata()
            .map_err(|e| format!("Failed to read file metadata: {}", e))?;
        let mut permissions = metadata.permissions();
        
        // Remove all permissions, then set to 600 (owner read/write)
        permissions.set_mode(0o600);
        fs::set_permissions("public/private_data/username_data.json", permissions)
            .map_err(|e| format!("Failed to set file permissions: {}", e))?;
    }

    Ok(())
}

#[tauri::command] 
pub fn retrieve_privatekey_from_file(username:String) -> TauriResult<String> {
    let file_name = format!("../public/private_data/{}_data.json", username);
    let path = PathBuf::from(file_name);
    
    // Open the file
    let mut file = File::open(path).map_err(|err| {
        eprintln!("Failed to open file: {:?}", err);
        tauri::Error::Io(err)
    })?;

    // Read the file's content into a String
    let mut json_data = String::new();
    file.read_to_string(&mut json_data).map_err(|err| {
        eprintln!("Failed to read file: {:?}", err);
        tauri::Error::Io(err)
    })?;
   

    // Deserialize the JSON data
    let private_data: PrivateData = serde_json::from_str(&json_data).map_err(|err| {
        eprintln!("Failed to deserialize JSON data: {:?}", err);
        tauri::Error::Io(io::Error::new(io::ErrorKind::Other, err))
    })?;
    Ok(private_data.priv_key)

}

