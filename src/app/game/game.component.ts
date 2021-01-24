import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {User} from '../model/user';
import {Game} from '../model/game';
import {NotificationType} from '../enum/notification-type.enum';
import {HttpErrorResponse} from '@angular/common/http';
import {GameEditorService} from '../service/game-editor.service';
import {NotificationService} from '../service/notification.service';
import {Router} from '@angular/router';
import {AuthenticationService} from '../service/authentication.service';
import {SubSink} from 'subsink';
import {Step} from '../model/step';
import {StepForGame} from '../model/stepForGame';
import {environment} from '../../environments/environment';
import {Card} from '../model/card';
import {CustomHttpResponse} from '../model/custom-http-response';


@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit, OnDestroy {
  public refreshing = false;
  public currentUser = new User();
  public presence = false;
  public game = new Game();
  private subs = new SubSink();
  public currentGames: Game[] = [];
  public currentGame = new Game();
  public currentSteps: Step[] = [];
  public stepsForGame: StepForGame[] = [];
  public showCardUrl: string;
  public showJud: string;
  public defaultUrlBackCard: string;

  constructor(private router: Router,
               private gameEditorService: GameEditorService,
              private authenticationService: AuthenticationService,
               private notificationService: NotificationService) { }

  ngOnInit(): void {
    if (this.authenticationService.isLoggedIn()){
      this.currentUser = this.authenticationService.getUserFromLocalCache();
      this.presence=true;
    }else {
      this.router.navigateByUrl('/main')
    }
    this.addGamesToStorage();
    this.defaultUrlBackCard = environment.defaultPhoto;
  }

  ngOnDestroy(): void {
    this.stepsForGame = null;
    this.subs.unsubscribe();
  }

  public onLogOut(): void {
    this.authenticationService.logOut();
    this.router.navigateByUrl('main');
    this.sendNotification(NotificationType.SUCCESS, `You've been successfully logged out`);
  }

  private addGamesToStorage() {
    this.subs.add(
      this.gameEditorService.getGames(this.currentUser.email).subscribe(
        (response: Game[]) => {
          this.gameEditorService.addGamesToLocalCache(response);
          this.currentGames = response;
          this.sendNotification(NotificationType.SUCCESS,`${response.length}  игры загружено для пользователя ${this.currentUser.firstName}` );
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message)
        }
      ));
  }

  selectGame(game: Game) {
     // this.currentSteps= [];
     this.currentSteps = game.steps;
     if(this.currentSteps.some(step => step.deckId === null)){
       this.notificationService.notify(NotificationType.INFO, 'В игре не хватает колод(ы)');
     }else {
       this.stepsForGame = [];
       for (let step of this.currentSteps){
         const stepGame = new StepForGame();
         stepGame.id = step.id;
         stepGame.name = step.name;
         stepGame.title = step.title;
         stepGame.deckId = step.deckId;
         this.stepsForGame.push(stepGame);
       }
       for (let step of this.currentSteps){
        this.getStepForGame(step.id);
       }
       this.currentGame = game;
     }
  }
  private static sortSteps(stepsForGame: StepForGame[]): StepForGame [] {
   return  stepsForGame.sort((step,next) => step > next ? -1 : 1);
  }

  public getStepForGame(stepId: string) {
    this.refreshing = true;
    this.subs.add(
      this.gameEditorService.getStepGame(stepId).subscribe(
        (response: StepForGame) =>{
          this.stepsForGame.find(s => s.id === stepId)
            .urlPicture = response.urlPicture;
          this.stepsForGame.find(s => s.id === stepId)
            .judgment = response.judgment;
          this.refreshing = false;

        },
        (errorResponse: HttpErrorResponse ) => {
          this.sendNotification(NotificationType.ERROR , errorResponse.error.message );
          this.refreshing = false;
        }
      )
    );
  }

  // очистка использованных карт
  cleanUsersSteps() {
    this.subs.add(
      this.gameEditorService.resetMemoryUsedCard(this.currentUser.email).subscribe(
        (response: CustomHttpResponse) =>{
          this.sendNotification(NotificationType.INFO, response.message);
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
        }
      )
    );
  }


  openCard(id: string) {
    this.showCardUrl = this.stepsForGame.find(step => step.id === id).urlPicture;
    this.clickButton('onCard')
  }

  private clickButton(buttonId: string): void{
    document.getElementById(buttonId).click();
  }

  openJud(id: string) {
    this.showJud = this.stepsForGame.find(step => step.id === id).judgment;
  }

  private sendNotification(notificationType: NotificationType, message: string): void {
    if(message){
      this.notificationService.notify(notificationType, message);
    }else {
      this.notificationService.notify(notificationType, 'An error occurred. Please try again. ');
    }
  }
}
