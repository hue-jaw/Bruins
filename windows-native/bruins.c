/* BRUINS — portage natif Windows (Win32/GDI + winmm), chapitre des Ruines.
   Meme contenu que le projet GameMaker (memes textes FR, memes regles).
   Compile: zig cc -target x86_64-windows-gnu -O2 -o BRUINS.exe bruins.c -luser32 -lgdi32 -lwinmm -Wl,--subsystem,windows
   Musique: WAV uniquement (PlaySound) — versions 22 050 Hz mono des arrangements. */
#include <windows.h>
#include <mmsystem.h>
#include <stdio.h>
#include <string.h>
#include <math.h>
#include "assets.h"

#define WW 640
#define WH 360

static HWND hwnd;
static int mode; /*0 titre 1 monde 2 dialogue 3 combat 4 inventaire 5 mort 6 choix rencontre*/
static int sel, area, px, py, walking;
static double gtime;
static int hp, maxhp, gold_, scores[10], trust_, kills_, spared_;
static int fl_met, fl_puzzle, fl_candy, fl_enemy, fl_enemy_spared, fl_boss, fl_boss_spared, fl_promise_discussed, fl_promise, fl_cooked, fl_book, fl_secret, fl_end;
static int inv_id[8], inv_n[8], inv_count;
static int puzzle[3], puzzle_n;
static char msg[160]; static double msgT;
static const char *dlg_lines[8]; static int dlg_n, dlg_i, dlg_after;
static int choice_sel;
static char curMus[32];

typedef struct { int kind, x, y, to, tx, ty, note; const char *label; } Ent;
/* kind: 0 mere 1 save 2 porte 3 panneau 4 pierre 5 boite 6 ennemi 7 boss 8 cuisine 9 livre 10 mur 11 boutique 12 acheter 13 fin */
static const char *MAP[10] = {
"####################","#..................#","#..##.........##...#","#..................#",
"#..................#","#..................#","#..................#","#...##.............#",
"#..................#","####################"};
static const char *AREA_NAME[4] = {"Le lit de fleurs","Les pierres chantantes","Une maison pour deux souvenirs","La porte sans lendemain"};
static Ent ents[4][12]; static int ents_n[4];

static void init_ents(void){
  int n=0;
  ents[0][n++]=(Ent){0,330,170,0,0,0,0,"Toriel"}; ents[0][n++]=(Ent){1,110,130,0,0,0,0,"Sauvegarder"};
  ents[0][n++]=(Ent){2,590,170,1,65,180,0,"Ruines >"}; ents_n[0]=n; n=0;
  ents[1][n++]=(Ent){2,48,180,0,560,170,0,"< Fleurs"}; ents[1][n++]=(Ent){2,320,48,2,320,260,0,"Maison ^"};
  ents[1][n++]=(Ent){2,590,170,3,65,180,0,"Cour >"}; ents[1][n++]=(Ent){3,130,105,0,0,0,0,"Inscription"};
  ents[1][n++]=(Ent){4,230,140,0,0,0,0,"Pierre I"}; ents[1][n++]=(Ent){4,320,140,0,0,0,1,"Pierre II"};
  ents[1][n++]=(Ent){4,410,140,0,0,0,2,"Pierre III"}; ents[1][n++]=(Ent){5,230,245,0,0,0,0,"Boite"};
  ents[1][n++]=(Ent){6,470,245,0,0,0,0,"Mousselin"}; ents[1][n++]=(Ent){1,80,250,0,0,0,0,"Sauvegarder"}; ents_n[1]=n; n=0;
  ents[2][n++]=(Ent){2,320,270,1,320,80,0,"Ruines v"}; ents[2][n++]=(Ent){0,320,150,0,0,0,0,"Toriel"};
  ents[2][n++]=(Ent){8,130,160,0,0,0,0,"Cuisiner"}; ents[2][n++]=(Ent){9,460,110,0,0,0,0,"Lire ensemble"};
  ents[2][n++]=(Ent){10,530,110,0,0,0,0,"Mur"}; ents[2][n++]=(Ent){1,95,250,0,0,0,0,"Sauvegarder"};
  ents[2][n++]=(Ent){11,450,240,0,0,0,0,"Plic"}; ents[2][n++]=(Ent){12,530,240,0,0,0,0,"Bonbon : 5"}; ents_n[2]=n; n=0;
  ents[3][n++]=(Ent){2,48,180,1,560,170,0,"< Ruines"}; ents[3][n++]=(Ent){7,370,170,0,0,0,0,"Gardien"};
  ents[3][n++]=(Ent){1,130,250,0,0,0,0,"Sauvegarder"}; ents[3][n++]=(Ent){13,570,170,0,0,0,0,"Foret >"}; ents_n[3]=n;
}
static const char *ITEM_NAME[3] = {"Bonbon d'echo","Tarte au miel","Fragment de memoire"};
static const int ITEM_HEAL[3] = {8,18,0};
static const char *AFF_NAME[10] = {"Determination","Patience","Bravoure","Integrite","Perseverance","Gentillesse","Justice","Empathie","Curiosite","Chaos"};
static const COLORREF AFF_COL[10] = {RGB(235,63,85),RGB(90,224,241),RGB(246,153,65),RGB(90,121,244),RGB(180,97,224),RGB(98,222,133),RGB(250,213,65),RGB(255,150,190),RGB(110,202,189),RGB(160,60,200)};

static int soul_idx(void){ int b=0; for(int i=1;i<10;i++) if(scores[i]>scores[b]) b=i; return b; }
static void notice(const char *t){ strncpy(msg,t,sizeof(msg)-1); msg[sizeof(msg)-1]=0; msgT=3; }
static void music(const char *name){
  if(!strcmp(curMus,name)) return; strncpy(curMus,name,31);
  char path[MAX_PATH]; snprintf(path,sizeof(path),"music\\%s.wav",name);
  PlaySoundA(path,NULL,SND_ASYNC|SND_LOOP|SND_FILENAME);
}
static void add_item(int id,int n){
  for(int i=0;i<inv_count;i++) if(inv_id[i]==id){ inv_n[i]+=n; return; }
  if(inv_count<8){ inv_id[inv_count]=id; inv_n[inv_count]=n; inv_count++; } else notice("Inventaire plein.");
}
static void new_game(void){
  hp=maxhp=24; gold_=12; memset(scores,0,sizeof(scores)); scores[0]=25;
  trust_=kills_=spared_=0; fl_met=fl_puzzle=fl_candy=fl_enemy=fl_enemy_spared=fl_boss=fl_boss_spared=0;
  fl_promise_discussed=fl_promise=fl_cooked=fl_book=fl_secret=fl_end=0;
  inv_count=0; add_item(0,2); puzzle_n=0; area=0; px=160; py=200;
}
static void save_game(void){
  FILE *f=fopen("bruins_save.txt","w"); if(!f) return;
  fprintf(f,"%d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d\n",area,px,py,hp,gold_,
    fl_met,fl_puzzle,fl_candy,fl_enemy,fl_enemy_spared,fl_boss,fl_boss_spared,fl_promise_discussed,fl_promise,fl_cooked,fl_book,fl_secret,kills_,spared_);
  for(int i=0;i<10;i++) fprintf(f,"%d ",scores[i]); fprintf(f,"\n%d\n",inv_count);
  for(int i=0;i<inv_count;i++) fprintf(f,"%d %d\n",inv_id[i],inv_n[i]);
  fclose(f); notice("Souvenir conserve. (bruins_save.txt)");
}
static int load_game(void){
  FILE *f=fopen("bruins_save.txt","r"); if(!f) return 0;
  if(fscanf(f,"%d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d",&area,&px,&py,&hp,&gold_,
    &fl_met,&fl_puzzle,&fl_candy,&fl_enemy,&fl_enemy_spared,&fl_boss,&fl_boss_spared,&fl_promise_discussed,&fl_promise,&fl_cooked,&fl_book,&fl_secret,&kills_,&spared_)!=19){ fclose(f); return 0; }
  /* relire correctement: les deux derniers champs sont kills/spared (ordre ci-dessus) */
  for(int i=0;i<10;i++) if(fscanf(f,"%d",&scores[i])!=1) scores[i]=0;
  if(fscanf(f,"%d",&inv_count)!=1) inv_count=0;
  if(inv_count<0) inv_count=0; if(inv_count>8) inv_count=8;
  for(int i=0;i<inv_count;i++) if(fscanf(f,"%d %d",&inv_id[i],&inv_n[i])!=2){ inv_n[i]=1; }
  fclose(f); maxhp=24; if(hp<1) hp=24; return 1;
}

/* ---------- dialogues ---------- */
static void start_dlg(const char **lines,int n,int after){ for(int i=0;i<n;i++) dlg_lines[i]=lines[i]; dlg_n=n; dlg_i=0; dlg_after=after; mode=2; }
static const char *L_OPEN[] = {"??? : Tu es revenu. Pourtant... je ne me souviens pas t'avoir laisse partir.",
  "Des fleurs pales poussent sous la pierre. Tu te releves. Quelqu'un attend pres de la lampe. Fleches/WASD: marcher. Entree/Z: parler."};
static const char *L_MEET[] = {"Toriel : Oh... mon enfant. Je pensais ne jamais te revoir. Attends... Ton ame... elle n'avait pas cette couleur."};
static const char *L_WHO[] = {"Toriel : Toriel. Un nom suffit pour commencer. Tu n'as pas a me donner le tien avant de le vouloir.",
  "Toriel : Va vers l'est quand tu seras pret. Les pierres chantent, ici. Ecoute-les dans l'ordre : III, I, II."};
static const char *L_KNOW[] = {"Toriel : Je connais un enfant qui compte les marches. Un autre qui en a peur. Les deux avaient ton visage.",
  "Toriel : Va vers l'est quand tu seras pret. Les pierres chantent, ici. Ecoute-les dans l'ordre : III, I, II."};
static const char *L_SILENT[] = {"Toriel : ... Tres bien. Le silence aussi est une reponse. Je resterai pres de la lampe.",
  "Toriel : Va vers l'est quand tu seras pret. Les pierres chantent, ici. Ecoute-les dans l'ordre : III, I, II."};
static const char *L_HOME[] = {"Toriel : Cette maison garde deux souvenirs de toi. Aucun ne veut partir le premier.",
  "Toriel : Promets-moi seulement ceci : quand la porte te demandera de choisir, choisis en te souvenant d'eux."};
static const char *L_GRIEF[] = {"Toriel : Tu as les mains plus lourdes qu'hier. Je ne te demanderai pas pourquoi. Pas encore."};
static const char *L_RETURN[] = {"Toriel : La cour est silencieuse. Merci de l'avoir traversee sans ajouter un nom a la pierre."};
static const char *L_SIGN[] = {"Inscription : III - I - II. Ce que la porte retient, la patience le delivre."};
static const char *L_PUZZLE[] = {"L'accord resonne sous tes pieds. A l'est, une porte s'ouvre sans bruit."};
static const char *L_COOK[] = {"Vous cuisinez en silence. Tarte au miel obtenue. Certaines recettes sont des excuses qui ont reussi."};
static const char *L_COOK2[] = {"La cuisine est rangee. Une assiette propre attend un prochain souvenir."};
static const char *L_BOOK[] = {"Toriel lit une page, puis la relit comme si la fin avait change. Le mur du fond semble... creux."};
static const char *L_SECRET[] = {"Derriere les livres : un fragment de memoire. Une photographie ou ton visage a ete efface."};
static const char *L_SHOP[] = {"Plic : Je vends des bonbons et je rachete les silences. Les tiens valent cher, on dirait."};
static const char *L_FRIEND[] = {"Mousselin te regarde passer. Une feuille te salue, peut-etre."};
static const char *L_EMPTY[] = {"Il n'y a plus que le vent et des feuilles quietes."};
static const char *L_GATE[] = {"Le Gardien n'est plus la. La porte reste ouverte, comme une phrase inachevee."};
static const char *L_VICT_K[] = {"Tu as choisi la compassion. L'ame du lieu respire un peu mieux."};
static const char *L_VICT_X[] = {"Le silence qui suit n'a pas la meme forme qu'avant."};
static const char *L_END_K[] = {"Fin du chapitre des Ruines (version de demonstration). La foret attend, dans une autre timeline..."};
static const char *L_END_X[] = {"Fin du chapitre des Ruines. La foret, elle, se souviendra de tes pas."};

/* ---------- combat ---------- */
static struct { int id, ehp, calm, turn, stage, sel, sub; double t, spawn, inv, aim;
  int bx[256], by[256]; double bvx[256], bvy[256]; int bn; int hx, hy; int listened, protected_; char text[200]; } B;
static const char *EN_NAME[2] = {"Mousselin","Le Gardien creux"};
static const int EN_HP[2]={25,80}, EN_ATK[2]={3,4}, EN_DEF[2]={1,3}, EN_REW[2]={8,20}, EN_MERCY[2]={3,4};
static const char *ACT_NAME[2][4] = {{"EXAMINER","ECOUTER","ATTENDRE","MENACER"},{"EXAMINER","ECOUTER","PROTEGER","SE SOUVENIR"}};
static const char *ACT_RESP[2][4] = {
 {"Il confond chaque pas avec une menace. Attendre peut l'aider.","'J'ai vu ta main avant de voir ton visage.'","Tu poses les mains au sol. Une feuille se detend.","Il se replie. La peur devient plus bruyante."},
 {"Il protege une absence. Ecoute-la, puis protege ce qui reste.","'Ils sont passes. Je suis reste. Pourquoi suis-je reste ?'","Tu empeches une pierre de tomber sur les fleurs. Il regarde tes mains.","Tu ne promets pas le retour des disparus. Seulement une place pour leur memoire."}};
static const int ACT_CALM[2][4] = {{0,1,2,-2},{0,2,2,1}};
static void start_battle(int id){
  memset(&B,0,sizeof(B)); B.id=id; B.ehp=EN_HP[id]; B.hx=320; B.hy=245;
  strncpy(B.text, id? "\"Cette fois, personne ne passera. Je ne perdrai plus personne.\"" : "Il tremble. Les feuilles autour de lui tremblent aussi.",199);
  mode=3; music(id?"battle":"battle");
}
static void battle_end(int spared){
  if(B.id==0){ fl_enemy=1; fl_enemy_spared=spared; } else { fl_boss=1; fl_boss_spared=spared; }
  gold_ += EN_REW[B.id];
  if(spared){ spared_++; scores[5]+=35; if(scores[5]>100)scores[5]=100; scores[7]+=12; if(fl_promise) { /* promesse tenue */ } start_dlg(L_VICT_K,1,0); }
  else { kills_++; scores[9]+=18; trust_-=4; start_dlg(L_VICT_X,1,0); }
  music(area==3?"ruins":"ruins");
}
static void battle_turn(void){ B.stage=4; B.t=0; B.spawn=0; B.bn=0; B.hx=320; B.hy=245; B.inv=.7; B.turn++;
  snprintf(B.text,sizeof(B.text),"Ame %s : tiens bon.",AFF_NAME[soul_idx()]); }
static void do_damage(void){
  if(B.inv>0) return; int d=EN_ATK[B.id]; if(soul_idx()==0 && hp<=6) d--; if(d<1)d=1;
  hp-=d; if(hp<0)hp=0; B.inv=1; if(hp<=0){ mode=5; PlaySoundA(NULL,NULL,0); }
}

/* ---------- interaction ---------- */
static int is_wall(int x,int y){
  const int ox[2]={-8,8}, oy[2]={-5,2};
  for(int i=0;i<2;i++) for(int j=0;j<2;j++){ int tx=(x+ox[i])/32, ty=(y+oy[j])/32;
    if(tx<0||ty<0||tx>=20||ty>=10) return 1; if(MAP[ty][tx]=='#') return 1; } return 0;
}
static void enter_area(int a,int x,int y){ area=a; px=x; py=y; music(a==2?"toriel":a==3?"ruins":"ruins"); }
static void interact(Ent *e){
  switch(e->kind){
    case 0:
      if(!fl_met){ fl_met=1; start_dlg(L_MEET,1,1); music("toriel"); }
      else if(kills_>0) start_dlg(L_GRIEF,1,0);
      else if(fl_boss) start_dlg(L_RETURN,1,0);
      else if(fl_promise_discussed) start_dlg(fl_promise?L_HOME:L_SILENT, fl_promise?2:2, 0);
      else { fl_promise_discussed=1; fl_promise=1; start_dlg(L_HOME,2,0); } break;
    case 1: hp=maxhp; save_game(); break;
    case 2:
      if(e->to==1 && area==0 && !fl_met){ notice("Parle d'abord a la gardienne."); break; }
      if(e->to==3 && !fl_puzzle){ notice("La porte attend trois notes : III, I, II."); break; }
      enter_area(e->to,e->tx,e->ty); break;
    case 3: start_dlg(L_SIGN,1,0); break;
    case 4:
      if(fl_puzzle){ notice("L'accord est complet."); break; }
      puzzle[puzzle_n<3?puzzle_n:2]=e->note; { int ix=puzzle_n; const int seq[3]={2,0,1};
        if(puzzle[ix]!=seq[ix]){ puzzle_n=0; notice("Un echo sourd. Recommence : III, I, II."); }
        else if(ix==2){ fl_puzzle=1; scores[8]+=12; start_dlg(L_PUZZLE,1,0); }
        else { puzzle_n++; notice("La pierre chante."); } } break;
    case 5: if(!fl_candy){ fl_candy=1; add_item(0,1); scores[8]+=8; notice("Bonbon d'echo obtenu."); } else notice("La boite est vide."); break;
    case 6: if(!fl_enemy) start_battle(0); else start_dlg(fl_enemy_spared?L_FRIEND:L_EMPTY,1,0); break;
    case 7: if(!fl_boss) start_battle(1); else start_dlg(fl_boss_spared?L_GATE:L_EMPTY,1,0); break;
    case 8: if(!fl_cooked){ fl_cooked=1; add_item(1,1); scores[5]+=12; start_dlg(L_COOK,1,0); } else start_dlg(L_COOK2,1,0); break;
    case 9: if(!fl_book){ fl_book=1; scores[7]+=10; trust_+=2; } start_dlg(L_BOOK,1,0); break;
    case 10: if(fl_book){ if(!fl_secret){ fl_secret=1; add_item(2,1); scores[8]+=15; } start_dlg(L_SECRET,1,0); } else notice("Un mur couvert de poussiere."); break;
    case 11: start_dlg(L_SHOP,1,0); break;
    case 12: if(gold_>=5){ gold_-=5; add_item(0,1); notice("Merci. Un bonbon pour le chemin."); } else notice("Il faut 5 eclats."); break;
    case 13: if(fl_boss){ fl_end=1; start_dlg(kills_>0?L_END_X:L_END_K,1,0); } else notice("Le gardien ferme le passage."); break;
  }
}

/* ---------- entrees ---------- */
static int prevk[256];
static int pressed(int vk){ int d=(GetAsyncKeyState(vk)&0x8000)!=0; int p=d&&!prevk[vk]; prevk[vk]=d; return p; }
static int downk(int vk){ return (GetAsyncKeyState(vk)&0x8000)!=0; }
static int ok_pressed(void){ return pressed(VK_RETURN)||pressed('Z'); }
static void update_battle(double dt);
static void update(double dt){
  gtime+=dt; if(msgT>0) msgT-=dt;
  if(mode==0){
    if(pressed(VK_DOWN)||pressed('S')) sel=(sel+1)%3;
    if(pressed(VK_UP)||pressed('W')) sel=(sel+2)%3;
    if(ok_pressed()){ if(sel==0){ new_game(); start_dlg(L_OPEN,2,0); music("ruins"); }
      else if(sel==1){ if(load_game()){ mode=1; music("ruins"); } else notice("Aucune sauvegarde valide."); }
      else notice("BRUINS - chapitre des Ruines jouable."); }
  } else if(mode==5){
    if(ok_pressed()){ if(!load_game()){ new_game(); } mode=1; music("ruins"); }
  } else if(mode==6){
    const int eff[5][2]={{8,5},{7,6},{9,6},{2,8},{1,10}};
    if(pressed(VK_DOWN)||pressed('S')) choice_sel=(choice_sel+1)%5;
    if(pressed(VK_UP)||pressed('W')) choice_sel=(choice_sel+4)%5;
    if(ok_pressed()){ scores[eff[choice_sel][0]]+=eff[choice_sel][1];
      if(choice_sel==0) start_dlg(L_WHO,2,0); else if(choice_sel==1||choice_sel==2) start_dlg(L_KNOW,2,0); else start_dlg(L_SILENT,2,0); }
  } else if(mode==2){
    if(ok_pressed()){ dlg_i++; if(dlg_i>=dlg_n){ mode=1; if(dlg_after==1){ mode=6; choice_sel=0; } dlg_after=0; music(area==2?"toriel":"ruins"); } }
  } else if(mode==4){
    if(pressed(VK_ESCAPE)||pressed('X')||ok_pressed()) mode=1;
  } else if(mode==1){
    if(pressed('C')){ mode=4; return; }
    int dx=(downk(VK_RIGHT)||downk('D'))-(downk(VK_LEFT)||downk('A'));
    int dy=(downk(VK_DOWN)||downk('S'))-(downk(VK_UP)||downk('W'));
    walking=(dx||dy); double l=(dx&&dy)?0.7071:1.0;
    int nx=px+(int)(dx*105*dt*l), ny=py+(int)(dy*105*dt*l);
    if(!is_wall(nx,py)) px=nx; if(!is_wall(px,ny)) py=ny;
    if(ok_pressed()){ Ent *best=NULL; int bd=48;
      for(int i=0;i<ents_n[area];i++){ Ent *e=&ents[area][i];
        if(e->kind==6 && fl_enemy && !fl_enemy_spared) continue;
        if(e->kind==7 && fl_boss && !fl_boss_spared) continue;
        int d=(int)sqrt((double)(px-e->x)*(px-e->x)+(py-e->y)*(py-e->y)); if(d<bd){ bd=d; best=e; } }
      if(best) interact(best); }
  } else if(mode==3){
    update_battle(dt);
  }
}
static void update_battle(double dt){
  if(B.stage==0){ /* commande */
    if(pressed(VK_RIGHT)||pressed('D')) B.sel=(B.sel+1)%4;
    if(pressed(VK_LEFT)||pressed('A')) B.sel=(B.sel+3)%4;
    if(ok_pressed()){ B.sub=0; B.stage=B.sel==0?1:(B.sel==1?2:(B.sel==2?3:5)); if(B.stage==1) B.aim=0; }
  } else if(B.stage==1){ /* visee */
    B.aim+=dt*1.2;
    if(ok_pressed()||B.aim>=1){ double q=1-fabs(B.aim-.5)*2; if(q<0)q=0;
      int dmg=3+(int)(q*9)-EN_DEF[B.id]; if(dmg<1)dmg=1; B.ehp-=dmg;
      snprintf(B.text,sizeof(B.text),"%d degats.",dmg);
      if(B.ehp<=0) battle_end(0); else battle_turn(); }
  } else if(B.stage>=2 && B.stage<=4 && B.stage!=4){ /* menus ACT/ITEM/MERCY : stage 2,3,5 */
    /* (voir ci-dessous, stage 4 = esquive) */
  }
  if(B.stage==2||B.stage==3||B.stage==5){
    int count = B.stage==2?4 : B.stage==3? (inv_count?inv_count:1) : 2;
    if(pressed(VK_DOWN)||pressed('S')) B.sub=(B.sub+1)%count;
    if(pressed(VK_UP)||pressed('W')) B.sub=(B.sub+count-1)%count;
    if(pressed(VK_ESCAPE)||pressed('X')){ B.stage=0; return; }
    if(!ok_pressed()) return;
    if(B.stage==2){ int a=B.sub; B.calm+=ACT_CALM[B.id][a];
      if(B.id==0&&a==2) scores[1]+=10; if(B.id==1&&a==1) B.listened=1; if(B.id==1&&a==2) B.protected_=1;
      strncpy(B.text,ACT_RESP[B.id][a],199); B.stage=6; return; }
    if(B.stage==3){ if(inv_count==0){ strncpy(B.text,"Inventaire vide.",199); B.stage=6; return; }
      int id=inv_id[B.sub]; if(!ITEM_HEAL[id]){ notice("Cela ne se mange pas."); return; }
      hp+=ITEM_HEAL[id]; if(hp>maxhp)hp=maxhp;
      if(--inv_n[B.sub]<=0){ for(int i=B.sub;i<inv_count-1;i++){ inv_id[i]=inv_id[i+1]; inv_n[i]=inv_n[i+1]; } inv_count--; }
      strncpy(B.text,"Le gout te ramene au present.",199); B.stage=6; return; }
    if(B.stage==5){ if(B.sub==1){ if(B.id==1){ strncpy(B.text,"La porte est encore fermee.",199); B.stage=6; }
        else { mode=1; music("ruins"); } return; }
      if(B.calm>=EN_MERCY[B.id] && (B.id==0 || (B.listened&&B.protected_))) battle_end(1);
      else { strncpy(B.text,"Pas encore. Ecoute ce qui le retient.",199); B.stage=6; } return; }
  } else if(B.stage==6){
    if(ok_pressed()) battle_turn();
  } else if(B.stage==4){ /* esquive */
    B.t+=dt; if(B.inv>0)B.inv-=dt;
    int si=soul_idx(); int sp=si==2?175:125;
    int dx=(downk(VK_RIGHT)||downk('D'))-(downk(VK_LEFT)||downk('A'));
    int dy=(downk(VK_DOWN)||downk('S'))-(downk(VK_UP)||downk('W'));
    double l=(dx&&dy)?0.7071:1.0;
    B.hx+=(int)(dx*sp*dt*l); B.hy+=(int)(dy*sp*dt*l);
    if(B.hx<206)B.hx=206; if(B.hx>434)B.hx=434; if(B.hy<186)B.hy=186; if(B.hy>282)B.hy=282;
    double bscale=(si==1&&downk(VK_SPACE))?0.35:1.0;
    double interval=B.id?0.42:0.65; B.spawn-=dt;
    if(B.spawn<=0 && B.bn<250){ B.spawn+=interval; int pat=B.turn%4; double vel=90;
      if(pat==0){ B.bx[B.bn]=220+((int)(B.t/interval)*47)%200; B.by[B.bn]=180; B.bvx[B.bn]=0; B.bvy[B.bn]=vel; B.bn++; }
      else if(pat==1){ double a=atan2((double)(B.hy-180),(double)(B.hx-320)); B.bx[B.bn]=320; B.by[B.bn]=180; B.bvx[B.bn]=cos(a)*vel; B.bvy[B.bn]=sin(a)*vel; B.bn++; }
      else if(pat==2){ for(int j=0;j<5 && B.bn<250;j++){ B.bx[B.bn]=320; B.by[B.bn]=180; B.bvx[B.bn]=j*14-28; B.bvy[B.bn]=vel; B.bn++; } }
      else { B.bx[B.bn]=215+((int)(B.t/interval)*53)%210; B.by[B.bn]=180; B.bvx[B.bn]=0; B.bvy[B.bn]=vel*1.2; B.bn++; } }
    for(int i=0;i<B.bn;i++){ B.bx[i]+=(int)(B.bvx[i]*dt*bscale); B.by[i]+=(int)(B.bvy[i]*dt*bscale);
      int ddx=B.bx[i]-B.hx, ddy=B.by[i]-B.hy;
      if(ddx*ddx+ddy*ddy<64){ do_damage(); B.by[i]=9999; }
      if(B.by[i]>298||B.by[i]<170||B.bx[i]<190||B.bx[i]>450){ B.bx[i]=B.bx[B.bn-1]; B.by[i]=B.by[B.bn-1]; B.bvx[i]=B.bvx[B.bn-1]; B.bvy[i]=B.bvy[B.bn-1]; B.bn--; i--; } }
    if(B.t>=6.5){ B.stage=0; strncpy(B.text, B.calm>=EN_MERCY[B.id]?"Il hesite. MERCY devient possible.":"Il cherche une issue sans te quitter des yeux.",199); }
  }
}

/* ---------- rendu ---------- */
static void draw_battle(void);
static HDC memdc; static HBITMAP membmp;
static void rect(int x,int y,int w,int h,COLORREF c){ HBRUSH b=CreateSolidBrush(c); RECT r={x,y,x+w,y+h}; FillRect(memdc,&r,b); DeleteObject(b); }
static void text(const char *t,int x,int y,COLORREF c,int sz){
  SetTextColor(memdc,c); SetBkMode(memdc,TRANSPARENT);
  HFONT f=CreateFontA(sz,0,0,0,400,0,0,0,0,0,0,0,0,"Consolas"); HGDIOBJ o=SelectObject(memdc,f);
  TextOutA(memdc,x,y,t,(int)strlen(t)); SelectObject(memdc,o); DeleteObject(f);
}
static void wrap(const char *t,int x,int y,int maxw,COLORREF c,int sz){
  char buf[512]; strncpy(buf,t,511); buf[511]=0; char *p=buf; int yy=y;
  HFONT f=CreateFontA(sz,0,0,0,400,0,0,0,0,0,0,0,0,"Consolas"); HGDIOBJ o=SelectObject(memdc,f);
  SetTextColor(memdc,c); SetBkMode(memdc,TRANSPARENT);
  while(*p){ char line[128]; int len=0; char *last=NULL;
    while(p[len] && len<120){ if(p[len]==' ') last=&p[len]; len++; SIZE s; GetTextExtentPoint32A(memdc,p,len,&s); if(s.cx>maxw) break; }
    if(p[len] && last) len=(int)(last-p);
    memcpy(line,p,len); line[len]=0; TextOutA(memdc,x,yy,line,len); yy+=sz+5; p+=len; while(*p==' ')p++; }
  SelectObject(memdc,o); DeleteObject(f);
}
static void sprite(const unsigned int *sp,int w,int h,int x,int y,int scale){
  for(int j=0;j<h;j++) for(int i=0;i<w;i++){ unsigned int v=sp[j*w+i]; if(v>>24==0) continue;
    rect(x+i*scale,y+j*scale,scale,scale,RGB((v>>16)&255,(v>>8)&255,v&255)); }
}
static void draw(void){
  rect(0,0,WW,WH,RGB(20,16,30));
  if(mode==0){ text("B R U I N S",200,80,RGB(242,211,138),34);
    text("Fragments of a Broken Timeline",190,130,RGB(189,182,217),13);
    const char *o[3]={"NOUVELLE PARTIE","CHARGER","A PROPOS"};
    for(int i=0;i<3;i++) text(i==sel?"> ":"  ",220,190+i*32,RGB(255,255,255),14), text(o[i],245,190+i*32,i==sel?RGB(255,226,122):RGB(255,255,255),14);
    if(msgT>0) wrap(msg,120,300,420,RGB(255,226,122),12);
    text("Fleches/Z pour choisir",235,335,RGB(143,137,173),11); return; }
  if(mode==5){ text("Ton ame se fissure... mais un souvenir demeure.",120,160,RGB(229,83,110),16);
    text("Entree : revenir au dernier souvenir",190,200,RGB(255,255,255),13); return; }
  if(mode==3){ draw_battle(); return; }
  /* monde */
  static const COLORREF PAL[4][3]={{RGB(58,51,72),RGB(87,80,107),RGB(109,124,95)},{RGB(51,48,74),RGB(77,72,105),RGB(95,109,124)},{RGB(74,52,40),RGB(107,77,56),RGB(124,95,77)},{RGB(44,44,62),RGB(69,69,94),RGB(92,92,116)}};
  for(int y=0;y<10;y++) for(int x=0;x<20;x++){ rect(x*32,y*32,32,32, MAP[y][x]=='#'?PAL[area][0]:PAL[area][1]);
    if(MAP[y][x]!='#' && (x*7+y*13)%9==0) rect(x*32+13,y*32+13,5,5,PAL[area][2]); }
  text(AREA_NAME[area],14,8,RGB(232,226,255),12);
  char hud[96]; snprintf(hud,sizeof(hud),"PV %d/%d  Or %d  Ame: %s",hp,maxhp,gold_,AFF_NAME[soul_idx()]); text(hud,330,8,RGB(255,226,122),12);
  for(int i=0;i<ents_n[area];i++){ Ent *e=&ents[area][i];
    if(e->kind==6 && fl_enemy && !fl_enemy_spared) continue;
    if(e->kind==7 && fl_boss && !fl_boss_spared) continue;
    if(e->kind==0) sprite(SPR_MOTHER,SPR_MOTHER_W,SPR_MOTHER_H,e->x-18,e->y-42,2);
    else if(e->kind==6) sprite(SPR_ENEMY,SPR_ENEMY_W,SPR_ENEMY_H,e->x-28,e->y-24,3);
    else if(e->kind==7) sprite(SPR_ENEMY,SPR_ENEMY_W,SPR_ENEMY_H,e->x-40,e->y-34,4);
    else if(e->kind==1){ rect(e->x-8,e->y-8,16,16,RGB(255,217,77)); }
    else if(e->kind==4){ rect(e->x-13,e->y-13,26,26,RGB(109,127,217)); text(e->label,e->x-28,e->y-5,RGB(255,255,255),10); continue; }
    else if(e->kind==2||e->kind==13){ rect(e->x-16,e->y-20,32,40,RGB(138,109,79)); rect(e->x-3,e->y-3,6,6,RGB(255,217,77)); }
    else rect(e->x-11,e->y-11,22,22,RGB(154,134,200));
    text(e->label,e->x-(int)strlen(e->label)*3,e->y+18,RGB(232,226,255),11); }
  int bob=walking?(int)(sin(gtime*16)*1.5):0;
  sprite(SPR_CHILD,SPR_CHILD_W,SPR_CHILD_H,px-16,py-38+bob,2);
  text("Z: interagir  C: inventaire",14,338,RGB(207,201,232),11);
  if(msgT>0) wrap(msg,150,300,360,RGB(255,226,122),12);
  if(mode==2){ rect(28,238,584,104,RGB(13,11,22)); /* cadre */
    HBRUSH br=CreateSolidBrush(RGB(232,226,255)); RECT r={28,238,612,342}; FrameRect(memdc,&r,br); DeleteObject(br);
    if(dlg_i<dlg_n) wrap(dlg_lines[dlg_i],44,256,550,RGB(255,255,255),13);
    text("Z: continuer",520,322,RGB(189,182,217),11); }
  if(mode==6){ rect(28,190,584,152,RGB(13,11,22));
    text("Toriel attend ta reponse (fleches + Z) :",44,206,RGB(255,217,77),13);
    const char *ch[5]={"Qui etes-vous ?","Vous me connaissez ?","Je me souviens de vous.","Ne vous approchez pas.","Rester silencieux."};
    for(int i=0;i<5;i++) text(ch[i],64,232+i*20,i==choice_sel?RGB(255,226,122):RGB(255,255,255),12),
      text(i==choice_sel?">":" ",48,232+i*20,RGB(255,226,122),12); }
  if(mode==4){ rect(60,60,520,240,RGB(13,11,22));
    text("INVENTAIRE (C/X: fermer) - les objets se mangent en combat via ITEM",84,78,RGB(255,217,77),13);
    if(!inv_count) text("(vide)",84,116,RGB(255,255,255),12);
    for(int i=0;i<inv_count;i++){ char b[96]; snprintf(b,sizeof(b),"%s x%d (soigne %d)",ITEM_NAME[inv_id[i]],inv_n[i],ITEM_HEAL[inv_id[i]]); text(b,84,116+i*22,RGB(255,255,255),12); }
    char b[128]; snprintf(b,sizeof(b),"Ame dominante : %s",AFF_NAME[soul_idx()]); text(b,84,268,RGB(189,182,217),12); }
}
static void draw_battle(void){
  rect(0,0,WW,WH,RGB(10,8,18));
  sprite(SPR_ENEMY,SPR_ENEMY_W,SPR_ENEMY_H,320-(B.id?40:30),30,B.id?4:3);
  text(EN_NAME[B.id],280,8,RGB(255,255,255),15);
  char b[64]; snprintf(b,sizeof(b),"PV ennemi: %d",B.ehp>0?B.ehp:0); text(b,275,120,RGB(229,138,160),12);
  rect(198,178,244,112,RGB(13,11,22));
  HBRUSH br=CreateSolidBrush(RGB(255,255,255)); RECT r={198,178,442,290}; FrameRect(memdc,&r,br); DeleteObject(br);
  for(int i=0;i<B.bn;i++){ if(B.by[i]>295) continue; HBRUSH hb=CreateSolidBrush(RGB(242,242,255)); HGDIOBJ o=SelectObject(memdc,hb);
    Ellipse(memdc,B.bx[i]-5,B.by[i]-5,B.bx[i]+5,B.by[i]+5); SelectObject(memdc,o); DeleteObject(hb); }
  if(B.stage==4 || B.stage==0 || B.stage>=1){ COLORREF c=AFF_COL[soul_idx()];
    HBRUSH hb=CreateSolidBrush(c); HGDIOBJ o=SelectObject(memdc,hb);
    POINT pts[3]={{B.hx,B.hy+8},{B.hx-8,B.hy-4},{B.hx+8,B.hy-4}}; Ellipse(memdc,B.hx-7,B.hy-9,B.hx+7,B.hy+5);
    SelectObject(memdc,o); DeleteObject(hb); (void)pts; }
  rect(28,300,584,48,RGB(13,11,22));
  if(B.stage==0){ const char *o[4]={"FIGHT","ACT","ITEM","MERCY"};
    for(int i=0;i<4;i++){ text(o[i],80+i*140,318,B.sel==i?RGB(255,226,122):RGB(255,255,255),15); if(B.sel==i) text(">",60+i*140,318,RGB(255,226,122),15); } }
  else if(B.stage==1){ rect(120,322,400,10,RGB(51,51,51)); rect(120+(int)(400*B.aim),318,6,18,RGB(255,226,122)); text("Z au centre !",290,306,RGB(255,255,255),11); }
  else if(B.stage==2){ for(int i=0;i<4;i++) text(ACT_NAME[B.id][i],60,308+i*11,B.sub==i?RGB(255,226,122):RGB(255,255,255),11), text(B.sub==i?">":" ",44,308+i*11,RGB(255,226,122),11); }
  else if(B.stage==3){ if(!inv_count) text("(vide) X: retour",60,318,RGB(255,255,255),11);
    for(int i=0;i<inv_count;i++){ char bb[64]; snprintf(bb,sizeof(bb),"%s x%d",ITEM_NAME[inv_id[i]],inv_n[i]); text(bb,60,308+i*11,B.sub==i?RGB(255,226,122):RGB(255,255,255),11); } }
  else if(B.stage==5){ const char *o[2]={"EPARGNER","FUIR"}; for(int i=0;i<2;i++) text(o[i],60,312+i*16,B.sub==i?RGB(255,226,122):RGB(255,255,255),12), text(B.sub==i?">":" ",44,312+i*16,RGB(255,226,122),12); }
  else wrap(B.text,44,314,550,RGB(255,255,255),12);
  char h[48]; snprintf(h,sizeof(h),"PV %d/%d",hp,maxhp); text(h,540,8,RGB(255,226,122),13);
}

static LRESULT CALLBACK wndproc(HWND h,UINT m,WPARAM w,LPARAM l){
  if(m==WM_DESTROY){ PlaySoundA(NULL,NULL,0); PostQuitMessage(0); return 0; }
  if(m==WM_PAINT){ PAINTSTRUCT ps; HDC dc=BeginPaint(h,&ps);
    if(!memdc){ memdc=CreateCompatibleDC(dc); membmp=CreateCompatibleBitmap(dc,WW,WH); SelectObject(memdc,membmp); }
    draw(); BitBlt(dc,0,0,WW,WH,memdc,0,0,SRCCOPY); EndPaint(h,&ps); return 0; }
  return DefWindowProcA(h,m,w,l);
}
int WINAPI WinMain(HINSTANCE hi,HINSTANCE hp,LPSTR cmd,int show){
  (void)hp; (void)cmd; init_ents(); new_game(); mode=0;
  WNDCLASSA wc={0}; wc.lpfnWndProc=wndproc; wc.hInstance=hi; wc.lpszClassName="BRUINS"; wc.hCursor=LoadCursorA(NULL,IDC_ARROW);
  RegisterClassA(&wc);
  hwnd=CreateWindowExA(0,"BRUINS","BRUINS - Fragments of a Broken Timeline",WS_OVERLAPPEDWINDOW&~WS_MAXIMIZEBOX&~WS_THICKFRAME,
    CW_USEDEFAULT,CW_USEDEFAULT,656,399,NULL,NULL,hi,NULL);
  ShowWindow(hwnd,show);
  music("ruins");
  MSG m; DWORD last=GetTickCount();
  while(1){ while(PeekMessageA(&m,NULL,0,0,PM_REMOVE)){ if(m.message==WM_QUIT) return 0; TranslateMessage(&m); DispatchMessageA(&m); }
    DWORD now=GetTickCount(); double dt=(now-last)/1000.0; last=now; if(dt>0.05)dt=0.05;
    update(dt); InvalidateRect(hwnd,NULL,FALSE); Sleep(16); }
}
