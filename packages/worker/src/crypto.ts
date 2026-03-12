import { createDecipheriv } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
	const key = process.env.ENCRYPTION_KEY;
	if (!key || key.length !== 64) {
		throw new Error('ENCRYPTION_KEY must be a 64-character hex string');
	}
	return Buffer.from(key, 'hex');
}

export function decrypt(encrypted: string, iv: string): string {
	const key = getEncryptionKey();
	const ivBuffer = Buffer.from(iv, 'hex');

	const authTag = Buffer.from(encrypted.slice(-AUTH_TAG_LENGTH * 2), 'hex');
	const encryptedText = encrypted.slice(0, -AUTH_TAG_LENGTH * 2);

	const decipher = createDecipheriv(ALGORITHM, key, ivBuffer, { authTagLength: AUTH_TAG_LENGTH });
	decipher.setAuthTag(authTag);

	let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
	decrypted += decipher.final('utf8');

	return decrypted;
}
