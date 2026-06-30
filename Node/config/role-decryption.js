// encryption.js
const forge = require('node-forge');

const RSA_PRIVATE_KEY_PEM = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA3j1O4Ul71z8dkoV9yh2QLUUiiA+w70cF7YU53wIwRb7mtkzOkVLw2blgbxlP
tC1iY5gWOAyBoVNwpX0lZqfuq3K+Ji3smb6BOuZn/Vlt+/4PhqFwGB0iLiC75y5fIs5/i+DoDWVr
PkqdNDOhw9asI7HZFGphKgAHRyY+DHaCqvfukTl9cuVhrIYJrCQb1z307HuHGzywdaWt6wnf1WN2
lwoly33ugzHhCTLaiGbzZWq+YnsbewxzwTO50zC9890jbcdXhruk4zjfT3j2nLKV/KTA9OuNXESz
Mx3AwVaD7qtJBUR/nMPsE4gwx2M5ay/uRcTLV+mWIWZ7+y+VqcdaGQIDAQABAoIBAGHbCvWF/sKr
ZuESaG3rkIVucKMKjbT+R+zrAa1hcFH1me7haP9yTtz/lCe3NHI4nZ8O45GwaA/aBrrHnQVTonLZ
pkJ3bDvSN2Lw+w8CJryThNCaGxpzEY7QGQzVTUytMlosIOFtK8iU4B2RMoRh7RAWimhD4x60PoAk
paOlNyoCCWnyINN/571ZSWKSCv212w9ObB0Vy820Vh8LBCfMHoNUjv2xv2espmyIF95NGwQkR6qm
BbzMuElrionlgspQq07hQJRkFsKdOcjDulUsmk2VsL1rPQgbZ/X53gI8lHnkLFjxm8S7+ili6YuR
zk1GX2rC7EhlOMJsxe4vN4mUCwUCgYEA6Ji8KRqQgaNP/m8xDyiTo0NpF/2T8T01iaWYgOr60J3g
qaPm6GCVRr2rlstjzufHcLi2QpPoZs0GC7blySCC2DS0S3sK4aKf/83ggsHZmbCbknXtPKGqvZ8z
EVBWlmgAsybR7hvcC1kH5flxbKAwowuZ99TjelQ9ETsAPEN6BmsCgYEA9JnKy8Ps6O6CF2AVv8vx
Kt+gXNzvSvLHdHJtm4j9gar17AUXdlPCJ3jGxVqVyGd3QALE1cFRetwIPlPu79LenPMcMHc0gCk9
M7sRffyfD3UZ78rjSg36qkG+PXYs4+oJiH1sE72R+AM1vPchiamyeIpw4fpmoJcznanmHCddGosC
gYApZJz/t6GF4Jloz0LszqzPfjyir1b3tIvljhnAv5CZNa94oRmDu0R1jWWO9W0ysh7VGZod6RKP
0ObFiOwFygpfDaoUULZUB0vwCyRsQLFH350gCGqKwr6O9ljxONnf9GxDdaIgfMbBIjv8mlKsISnm
qjbhWvqMl5cyjMxy7RM3NwKBgQDG2cyLUVHloBj0pfGohkUexMSbGiYTuUG7gldnTbxCUVkyMoV7
deZurnpx8Q256ZuB135sBIiYKA8vlI64O6cs01uEbzSoSF5wEtHKqbgqGdonHrse9jRle6MMVmly
NE7hvo1Bkyj7BqkGYabLQsFLy8ivfiE2xxV4RKpFEx9WtwKBgQC6gN0D6pr0U/YJ+e4fyTNE8UPQ
c0lGBfcNOZPXPI6nY7wXNRobzIvtjqkO9WVC6WBAWUnYX8rqEgAwbxSrrd4Yycsey2PCkxXCAcqv
zfWGAE/yqDQt3g7fMBnTScXFedmuX/YFAYU+l0Si9TBHX4jhAMQjwM55n06GjSiq9mV4mA==
-----END RSA PRIVATE KEY-----`;

/**
* @param {Object} payload
* @param {string} payload.encryptedKey
* @param {string} payload.encryptedIV
* @param {string} payload.encryptedData
* @returns {Promise<T[] | null>}
*/
function decryptRole(payload) {
    return new Promise((resolve, reject) => {
        try {
            if (!payload ||
                !payload.encryptedKey ||
                !payload.encryptedIV ||
                !payload.encryptedData) {
                return resolve(null);
            }

            const rsaPrivateKey = forge.pki.privateKeyFromPem(RSA_PRIVATE_KEY_PEM);

            const encKeyBytes = forge.util.decode64(payload.encryptedKey);
            const encIvBytes = forge.util.decode64(payload.encryptedIV);
            const encDataBytes = forge.util.decode64(payload.encryptedData);

            const aesKeyBytes = rsaPrivateKey.decrypt(encKeyBytes, 'RSAES-PKCS1-V1_5');
            const aesIvBytes = rsaPrivateKey.decrypt(encIvBytes, 'RSAES-PKCS1-V1_5');

            const decipher = forge.cipher.createDecipher('AES-CBC', aesKeyBytes);
            decipher.start({ iv: aesIvBytes });
            decipher.update(forge.util.createBuffer(encDataBytes));
            const success = decipher.finish();

            if (!success) {
                console.error('AES decryption / unpadding failed');
                return resolve(null);
            }

            const decryptedUtf8 = forge.util.decodeUtf8(decipher.output.getBytes());
            const parsed = JSON.parse(decryptedUtf8);

            resolve(Array.isArray(parsed) ? parsed : null);
        } catch (err) {
            console.error('Decryption failed:', err);
            reject(err);
        }
    });
}

module.exports = {
    decryptRole
};