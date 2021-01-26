import {Component, ElementRef, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Deck} from '../../model/deck';
import {User} from '../../model/user';
import {environment} from '../../../environments/environment';
import {NgForm} from '@angular/forms';
import {NotificationService} from '../../service/notification.service';
import {GameEditorService} from '../../service/game-editor.service';
import {SubSink} from 'subsink';
import {AuthenticationService} from '../../service/authentication.service';
import {NotificationType} from '../../enum/notification-type.enum';
import {HttpErrorResponse} from '@angular/common/http';
import { Game } from '../../model/game';
import {CustomHttpResponse} from '../../model/custom-http-response';
import {Router} from '@angular/router';
import {Step} from '../../model/step';
import {CardService} from '../../service/card.service';
import {Judgment} from '../../model/judgment';

@Component({
  selector: 'app-playing-desk',
  templateUrl: './playing-desk.component.html',
  styleUrls: ['./playing-desk.component.css']
})
export class PlayingDeskComponent implements OnInit , OnDestroy{
  @Input() inputCurrentUser: User;
  @ViewChild('nameClean') nameClean: ElementRef;
  @ViewChild('formStep') formStep: ElementRef;
  @ViewChild('addJudgment') addJudgment: ElementRef;

public refreshing: boolean;
  public nameGame: string;
  public currentUser: User;
  public currentGame = new Game();
  public step = new Step();
  public judgment = new Judgment();
  public judgments: Judgment[] = [];
  public nameDeck: string;
  public nameOfDecks: string[]= [];
  public defaultUrlDeck: string;
  public currentDeck: Deck;
  public currentDecks: Deck[]
  public currentGames: Game[] = [];
  private subs = new SubSink();

  constructor(private router: Router,
              private cardService: CardService,
              private gameEditorService: GameEditorService,
              private authenticationService: AuthenticationService,
              private notificationService: NotificationService) {

  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    }

  ngOnInit(): void {
    this.defaultUrlDeck =  environment.defaultPhotoFront;
    this.currentUser = this.authenticationService.getUserFromLocalCache();
    this.addGamesFromDB();
  }

  onSaveStep(form: NgForm) {
    const  nameSelectedDeck = form.value['nameDeck'];
    const  nameStep = form.value['nameStep'];
     if(nameSelectedDeck.length > 1){
       const deck = this.currentDecks.find(x => x.name.toUpperCase() === nameSelectedDeck.toUpperCase());
       this.step.deckId= deck.id;
       this.step.title = nameStep;
       const formData = new FormData();
       formData.append('email', this.currentUser.email);
       formData.append('currentStepId', this.step.id);
       formData.append('currentDeckId', deck.id);
       formData.append('titleForStep', this.step.title);
    this.subs.add(
      this.gameEditorService.saveStep(formData).subscribe(
        (response: Step) => {
          this.step = response;
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
        }
      ));
     }
  }

  saveStep(stepShow: never) {
    this.step = stepShow;
  }

  selectGame(game: Game) {
    this.currentDecks = this.cardService.getDecksFromLocaleCache();
    this.getNamesDecks();
    this.currentGame = game;
    this.clickButton('on');
  }

  // добавляем суждения в базу
  onAddNewJudgment(newJudgment: NgForm) {
    this.refreshing= true;
    const text = newJudgment.value['judgment'];
    const formData = new FormData();
    formData.append('loggedEmail',this.currentUser.email  );
    formData.append('stepId', this.step.id);
    formData.append("text", text);
    this.clickButton('close-add-judgment');
    this.subs.add(
      this.gameEditorService.addJudgment(formData).subscribe(
        (response: Step) => {
          this.getJudgments(this.step.id);
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
          this.refreshing = false;
        },
        ()=> newJudgment.resetForm()
      )
    );
  }

// добавляем название новой игры и получаем для нее каркас
  onAddNameForGame(nameForm: NgForm) {
    this.refreshing= true;
    this.nameGame = nameForm.value['name'];
    const formData = new FormData();
    formData.append('loggedEmail',this.currentUser.email  );
    formData.append('nameGame', this.nameGame);
    // formData.append('lengthGame',  this.nameGame.length.toString());
    this.clickButton('close-add-name');
    this.subs.add(
      this.gameEditorService.addGame(formData).subscribe(
        (response: Game) => {
          this.currentGames.unshift(response);
          this.refreshing= false;
          this.addGamesFromDB();
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
          this.refreshing= false;
        },
        ()=> nameForm.resetForm()
      )
    );
  }

  // получаем корректые игры из базы данных
  private addGamesFromDB() {
    this.subs.add(
      this.gameEditorService.getGames(this.currentUser.email).subscribe(
        (response: Game[]) => {
          this.currentGames = response;
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message)
        }
      ));
  }



  // удаление игры

  public deleteGame(gameId: string): void {
    this.clickButton('close-delete-game');
    this.subs.add(
      this.gameEditorService.deleteGame(this.currentUser.email, gameId).subscribe(
        (response: CustomHttpResponse) =>  {
          this.sendNotification(NotificationType.SUCCESS,   response.message.toLowerCase() );
          this.addGamesFromDB();
          this.currentGame= new Game();
          this.clickButton('onEmpty');
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message)
        }
      ));
  }

  // вкл модального окна удаления игры
  onDeleteGame() {
    this.clickButton('deleteGameModal');
  }

  getPicture(deckId: string): string {
    if(this.currentDecks!==undefined){
      this.currentDeck = this.currentDecks.find(x=> x.id === deckId);
    }
    if(this.currentDeck !==undefined){
      this.nameDeck = this.currentDeck.name;
      return this.currentDeck.backOfCardUrl;
    }
    this.nameDeck = 'колода не выбрана';
    return this.defaultUrlDeck;
  }

  private getNamesDecks(){
    this.nameOfDecks = [];
    this.currentDecks.forEach(x=> {
     this.nameOfDecks.push(x.name) ;
    });
  }


  private getJudgments(stepId: string) {
    this.subs.add(
      this.gameEditorService.getJudgments(stepId).subscribe(
        (response: Judgment[]) => {
          this.judgments = response;
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
        }
      )
    );
  }

  deleteJudgment(id: string) {
    this.subs.add(
      this.gameEditorService.deleteJudgment(id).subscribe(
        (response: CustomHttpResponse) =>  {
          this.getJudgments(this.step.id);
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message)
        }
      )
    );
  }

  editJudgment(id: string) {
    this.judgment = this.judgments.find(x => x.id === id);
    this.clickButton('openEditJudgment');
  }

  onEditJudgment(editJudgment: NgForm) {
   const judgment = editJudgment.value['newJudgment'];
    const formData = new FormData();
    formData.append('judgmentId',this.judgment.id  );
    formData.append('text', judgment);
    this.clickButton('close-edit-judgment');
    this.subs.add(
      this.gameEditorService.editJudgment(formData).subscribe(
        (response: Judgment) => {
          this.getJudgments(this.step.id);
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message)
        },
        () => editJudgment.resetForm()
      )
    );
  }
  public cleanFormIfCancel(nameForm: NgForm) {
    nameForm.reset();
    this.clickButton('close-add-name');
    this.clickButton('close-add-judgment');
    this.clickButton('close-edit-judgment');
  }

  goToAddJudgments(step: Step) {
    this.step = step;
    this.getJudgments(this.step.id);
    this.clickButton('onJudgments');
  }

  onAddJudgment() {
    this.clickButton('openAddJudgment');
  }

  private clickButton(buttonId: string): void{
    document.getElementById(buttonId).click();
  }


  private sendNotification(notificationType: NotificationType, message: string): void {
    if(message){
      this.notificationService.notify(notificationType, message);
    }else {
      this.notificationService.notify(notificationType, 'An error occurred. Please try again. ');
    }
  }

  on() {
    console.log('Hello')
  }
}
