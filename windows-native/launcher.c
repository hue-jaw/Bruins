#include <string.h>
/* LANCEUR_BRUINS.exe — lance BRUINS.exe en forçant le dossier de travail
   sur celui du lanceur (pour que music\*.wav soit trouvé même via un raccourci). */
#include <windows.h>
#include <stdio.h>

int WINAPI WinMain(HINSTANCE hi, HINSTANCE hp, LPSTR cmd, int show){
    (void)hi; (void)hp; (void)cmd; (void)show;
    char dir[MAX_PATH], exe[MAX_PATH];
    GetModuleFileNameA(NULL, dir, MAX_PATH);
    char *slash = strrchr(dir, '\\');
    if(slash) *slash = 0;
    snprintf(exe, sizeof(exe), "%s\\BRUINS.exe", dir);
    if(GetFileAttributesA(exe) == INVALID_FILE_ATTRIBUTES){
        MessageBoxA(NULL, "BRUINS.exe introuvable.\nGarde LANCEUR_BRUINS.exe et BRUINS.exe dans le meme dossier (avec le dossier music).",
                    "BRUINS - Lanceur", MB_OK | MB_ICONERROR);
        return 1;
    }
    STARTUPINFOA si; PROCESS_INFORMATION pi;
    ZeroMemory(&si, sizeof(si)); si.cb = sizeof(si);
    ZeroMemory(&pi, sizeof(pi));
    if(!CreateProcessA(exe, NULL, NULL, NULL, FALSE, 0, NULL, dir, &si, &pi)){
        MessageBoxA(NULL, "Impossible de lancer BRUINS.exe.", "BRUINS - Lanceur", MB_OK | MB_ICONERROR);
        return 1;
    }
    CloseHandle(pi.hThread); CloseHandle(pi.hProcess);
    return 0;
}
