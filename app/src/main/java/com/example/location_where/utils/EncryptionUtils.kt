package com.example.location_where.utils

import android.util.Base64
import java.io.*
import java.security.MessageDigest
import javax.crypto.Cipher
import javax.crypto.CipherInputStream
import javax.crypto.CipherOutputStream
import javax.crypto.spec.IvParameterSpec
import javax.crypto.spec.SecretKeySpec

object EncryptionUtils {

    private const val ALGORITHM = "AES/CBC/PKCS5Padding"
    private const val KEY_SIZE = 32 // 256 bits
    private const val IV_SIZE = 16  // 128 bits

    // In a real app, retrieve these securely (e.g., from server or Keystore)
    private const val PASSPHRASE = "your_secret_passphrase_here"
    private val IV_BYTES = "0123456789012345".toByteArray()

    private fun getSecretKey(): SecretKeySpec {
        val digest = MessageDigest.getInstance("SHA-256")
        val keyBytes = digest.digest(PASSPHRASE.toByteArray())
        return SecretKeySpec(keyBytes, "AES")
    }

    fun encryptFile(inputFile: File, outputFile: File) {
        val key = getSecretKey()
        val iv = IvParameterSpec(IV_BYTES)
        val cipher = Cipher.getInstance(ALGORITHM)
        cipher.init(Cipher.ENCRYPT_MODE, key, iv)

        FileInputStream(inputFile).use { fis ->
            FileOutputStream(outputFile).use { fos ->
                CipherOutputStream(fos, cipher).use { cos ->
                    fis.copyTo(cos)
                }
            }
        }
    }

    fun calculateChecksum(file: File): String {
        val digest = MessageDigest.getInstance("SHA-256")
        FileInputStream(file).use { fis ->
            val buffer = ByteArray(8192)
            var read: Int
            while (fis.read(buffer).also { read = it } > 0) {
                digest.update(buffer, 0, read)
            }
        }
        return Base64.encodeToString(digest.digest(), Base64.NO_WRAP)
    }
}
