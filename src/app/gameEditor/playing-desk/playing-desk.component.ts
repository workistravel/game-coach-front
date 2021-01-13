import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {Deck} from '../../model/deck';
import {User} from '../../model/user';
import {environment} from '../../../environments/environment';
import {NgForm} from '@angular/forms';
import {NotificationService} from '../../service/notification.service';
import {GameEditorService} from '../../service/game-editor.service';
import {SubSink} from 'subsink';
import {AuthenticationService} from '../../service/authentication.service';
import {Card} from '../../model/card';
import {NotificationType} from '../../enum/notification-type.enum';
import {HttpErrorResponse} from '@angular/common/http';
import {stringify} from 'querystring';
import { Game } from '../../model/game';
import {CustomHttpResponse} from '../../model/custom-http-response';
import {Router} from '@angular/router';
import {Step} from '../../model/step';
import {CardService} from '../../service/card.service';

@Component({
  selector: 'app-playing-desk',
  templateUrl: './playing-desk.component.html',
  styleUrls: ['./playing-desk.component.css']
})
export class PlayingDeskComponent implements OnInit {
  @Input() inputCurrentUser: User;
  @ViewChild('nameClean') nameClean: ElementRef;
  @ViewChild('formStep') formStep: ElementRef;

public refreshing: boolean;
  public nameGame: string;
  public currentUser: User;
  public currentGame = new Game();
  public step = new Step();
  // public words: string[]= [];
  public nameDeck: string;
  public selectedName: string;
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
      )
    )
     }

  }

  saveStep(stepShow: never) {
    this.step = stepShow;
  }

  selectGame(game: Game) {
    this.currentDecks = this.cardService.getDecksFromLocaleCache();
    this.getNamesDecks();
    this.currentGame = game;
     // currentDeck.find(x => x.id == this.step.deckId);
    // this.words = game.name.split('');
    // this.words.unshift('Resource');

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
          this.sendNotification(NotificationType.SUCCESS,`${response.length}  игры загружено для пользователя ${this.currentUser.firstName}` );
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message)
        }

      )
    )

  }
  public cleanFormIfCancel(nameForm: NgForm) {
    nameForm.reset();
    this.clickButton('close-add-name');
  }
  public deleteGame(gameId: string): void {
    this.subs.add(
      this.gameEditorService.deleteGame(this.currentUser.email, gameId).subscribe(
        (response: CustomHttpResponse) =>  {
          this.sendNotification(NotificationType.SUCCESS,   response.message.toLowerCase() );
          this.addGamesFromDB();
          this.currentGame= new Game();
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message)
        }
      )
    );
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

  public selectDeck(id: string) {
    console.log(id)

  }


  getPicture(deckId: any): string {
     this.currentDeck = this.currentDecks.find(x=> x.id == deckId);
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
    } );
  }


  goToAddJudgments(step: Step) {
    console.log(step);
    console.log(this.currentGame);
    this.currentGame= new Game();

  }
}
