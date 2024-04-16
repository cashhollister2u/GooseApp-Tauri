// commands.rs
use serde::{Deserialize, Serialize};
use tauri::Result as TauriResult;
use std::io::Write;
use std::os::unix::fs::PermissionsExt;
use std::io::Read;
use rsa::{Pkcs1v15Encrypt, RsaPrivateKey, RsaPublicKey};
use rsa::{pkcs8::{DecodePublicKey}, pkcs1::{DecodeRsaPrivateKey}};
use rand::rngs::OsRng;
use base64::prelude::*;
use rayon::prelude::*;
use std::sync::Arc;
use std::fs::File;

//saving private info to file 
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
fn retrieve_privatekey_from_file(username:String) -> TauriResult<String> {
    let path = format!("User_keys/{}_data.pem", username);

    // Open the file
    let mut file = File::open(path).map_err(|err| {
        eprintln!("Failed to open file: {:?}", err);
        tauri::Error::Io(err)
    })?;

    // Read the file's content into a String
    let mut data = String::new();
    file.read_to_string(&mut data).map_err(|err| {
        eprintln!("Failed to read file: {:?}", err);
        tauri::Error::Io(err)
    })?;
    
    Ok(data)

}


//saving JWT to file 
#[tauri::command]
pub fn save_jwt_to_file(token:String) -> Result<(), String> {
    let path = format!("User_token/jwt.json");
    
    let mut file = File::create(path)
        .map_err(|e| format!("Failed to create jwt file: {}", e))?;
    file.write_all(token.as_bytes())
        .map_err(|e| format!("Failed to write jwt to file: {}", e))?;
        
    // Set file permissions to owner read/write (600) on Unix-based systems
    #[cfg(unix)]
    {
        use std::fs;

        let metadata = file.metadata()
            .map_err(|e| format!("Failed to read jwt file metadata: {}", e))?;
        let mut permissions = metadata.permissions();
        
        // Remove all permissions, then set to 600 (owner read/write)
        permissions.set_mode(0o600);
        fs::set_permissions("User_token/jwt.json", permissions)
            .map_err(|e| format!("Failed to set file permissions: {}", e))?;
    }

    Ok(())
}

#[tauri::command] 
pub fn retrieve_jwt_from_file() -> TauriResult<String> {
    let path = format!("User_token/jwt.json");

    // Open the file
    let mut file = File::open(path).map_err(|err| {
        eprintln!("Failed to open jwt file: {:?}", err);
        tauri::Error::Io(err)
    })?;

    // Read the file's content into a String
    let mut data = String::new();
    file.read_to_string(&mut data).map_err(|err| {
        eprintln!("Failed to read file: {:?}", err);
        tauri::Error::Io(err)
    })?;

    Ok(data)

}



//--encryption start--//

#[cfg(feature = "pem")]
use rsa::pkcs8::LineEnding;

#[derive(Serialize, Deserialize, Debug)]
struct Profile {
    username: String,
    public_key: String,
    full_name: String,
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
pub fn pull_messages_encrypted(messages: Vec<Message>, username: String) -> Result<Vec<Message>, String> {
    let private_key = match retrieve_privatekey_from_file(username.clone()){
        Ok(keypriv) => keypriv,
        Err(e) => return Err(e.to_string()),
    };

    let key = match RsaPrivateKey::from_pkcs1_pem(&private_key) {
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

    let key = match RsaPublicKey::from_public_key_pem(&public_key) {
    Ok(k) => k,
    Err(e) => return Err(format!("Failed to parse public key: {:?}", e)),
};
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
pub fn pull_message_to_decrypt(message: String, username:String) -> Result<String, String> {
    let private_key = match retrieve_privatekey_from_file(username){
        Ok(keypriv) => keypriv,
        Err(e) => return Err(e.to_string()),
    };

    let key = match RsaPrivateKey::from_pkcs1_pem(&private_key) {
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