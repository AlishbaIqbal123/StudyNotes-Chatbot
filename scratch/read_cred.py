import ctypes
from ctypes import wintypes

class CREDENTIAL_ATTRIBUTE(ctypes.Structure):
    _fields_ = [
        ('Keyword', ctypes.c_wchar_p),
        ('Flags', wintypes.DWORD),
        ('ValueSize', wintypes.DWORD),
        ('Value', ctypes.c_char_p)
    ]

class CREDENTIAL(ctypes.Structure):
    _fields_ = [
        ('Flags', wintypes.DWORD),
        ('Type', wintypes.DWORD),
        ('TargetName', ctypes.c_wchar_p),
        ('Comment', ctypes.c_wchar_p),
        ('LastWritten', wintypes.FILETIME),
        ('CredentialBlobSize', wintypes.DWORD),
        ('CredentialBlob', ctypes.c_void_p),
        ('Persist', wintypes.DWORD),
        ('AttributeCount', wintypes.DWORD),
        ('Attributes', ctypes.POINTER(CREDENTIAL_ATTRIBUTE)),
        ('TargetAlias', ctypes.c_wchar_p),
        ('UserName', ctypes.c_wchar_p)
    ]

advapi32 = ctypes.WinDLL('advapi32', use_last_error=True)

CredRead = advapi32.CredReadW
CredRead.argtypes = [ctypes.c_wchar_p, wintypes.DWORD, wintypes.DWORD, ctypes.POINTER(ctypes.POINTER(CREDENTIAL))]
CredRead.restype = wintypes.BOOL

CredFree = advapi32.CredFree
CredFree.argtypes = [ctypes.c_void_p]
CredFree.restype = None

credential_pointer = ctypes.POINTER(CREDENTIAL)()
res = CredRead("git:https://huggingface.co", 1, 0, ctypes.byref(credential_pointer))
if res:
    cred = credential_pointer.contents
    blob = ctypes.string_at(cred.CredentialBlob, cred.CredentialBlobSize)
    print("User:", cred.UserName)
    try:
        pw = blob.decode('utf-16')
    except:
        pw = blob.decode('utf-8')
    print("Token:", pw)
    CredFree(credential_pointer)
else:
    print("Failed to read credential. Error code:", ctypes.get_last_error())
