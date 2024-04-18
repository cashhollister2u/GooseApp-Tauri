import { readTextFile, BaseDirectory } from '@tauri-apps/api/fs';

//JWT token management
export async function saveJWT(token: string) {
    // Dynamic import 
    //const { BaseDirectory } = await import('@tauri-apps/api/path');
    const { exists, createDir, writeTextFile } = await import('@tauri-apps/api/fs');
  
    try {
      const doesExist = await exists('JWTtoken/jwt.json', { dir: BaseDirectory.AppData });
  
      if (!doesExist) {
        await createDir('JWTtoken', { dir: BaseDirectory.AppData, recursive: true });
      }
  
      await writeTextFile('JWTtoken/jwt.json', token, { dir: BaseDirectory.AppData });
  
    } catch (err) {
      console.error('Error saving jwt:', err);
    }
  }


export async function retireveJWT() {
    try {
      const contents = await readTextFile('JWTtoken/jwt.json', { dir: BaseDirectory.AppData }) as string;
      const jsonData = JSON.parse(contents);
     
      return jsonData
    } catch (err) {
      console.log('JWT does not exist');
    }
  }

//RSA key management
export async function savePrivateKey(private_key: string, username:string) {
    // Dynamic import 
    //const { BaseDirectory } = await import('@tauri-apps/api/path');
    const { exists, createDir, writeTextFile } = await import('@tauri-apps/api/fs');
  
    try {
      const doesExist = await exists(`User_keys/${username}_privKey.pem`, { dir: BaseDirectory.AppData });
  
      if (!doesExist) {
        await createDir('User_keys', { dir: BaseDirectory.AppData, recursive: true });
      }
  
      await writeTextFile(`User_keys/${username}_privKey.pem`, private_key, { dir: BaseDirectory.AppData });
  
    } catch (err) {
      console.error('Error saving private key:', err);
    }
  }


export async function retirevePrivKey(username:string) {
    try {
        const contents = await readTextFile(`User_keys/${username}_privKey.pem`, { dir: BaseDirectory.AppData }) as string;

        return contents

    } catch (err) {
        console.error('Error retrieving private key:', err);
    }
}