import {Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {AuthenticationService} from '../service/authentication.service';
import {User} from '../model/user';
import {Router} from '@angular/router';
import {NotificationType} from '../enum/notification-type.enum';
import {NotificationService} from '../service/notification.service';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {CardService} from '../service/card.service';
import {SubSink} from 'subsink';
import {HttpErrorResponse} from '@angular/common/http';
import {Deck} from '../model/deck';
import {CustomHttpResponse} from '../model/custom-http-response';
import {environment} from '../../environments/environment';
import {Card} from '../model/card';

@Component({
  selector: 'app-cards',
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.css']
})
export class CardsComponent implements OnInit ,OnDestroy {
  @ViewChild('formAdd') formAdd: ElementRef;
  @ViewChild('formEdit') formEdit: ElementRef;
  public outputDeck: Deck;
  public outputCards: Card[];

  public currentUser = new User();
  public oldUrlPicture: string;
  public urlForPresent: string;
  public decks:  Deck[];
  public currentDeck: Deck;
  public deckId: string;
  public refreshing: boolean;
  private deckImage: File;
  public fileName: string;
  public deckName: string;
  private subs = new SubSink();
  public presence = false;
  public newDeckForm: FormGroup;
  public editDeckForm: FormGroup;



  constructor(private router: Router,
              private notificationService: NotificationService,
              private authenticationService: AuthenticationService,
              private cardService: CardService) { }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    }

  ngOnInit(): void {
    this.urlForPresent = environment.defaultPhoto;
    this.refreshing = false;
    this.editDeckForm = new FormGroup({
      replaceNameDeck: new FormControl('',[Validators.minLength(3), Validators.required] )
    })
    this.newDeckForm = new  FormGroup({
      deckName: new FormControl('',[Validators.minLength(3), Validators.required] )
    });
    if (this.authenticationService.isLoggedIn()){
      this.currentUser = this.authenticationService.getUserFromLocalCache();
      this.addDeckToStorage();
      this.presence= true;
    }else {
      this.router.navigateByUrl('/main')
    }
  }

  onLogOut(): void{
    this.authenticationService.logOut();
    this.sendNotification(NotificationType.SUCCESS, `You've been successfully logged out`);
  }

  private static clickButton(buttonId: string): void{
    document.getElementById(buttonId).click();
  }

  private sendNotification(notificationType: NotificationType, message: string): void {
    if(message){
      this.notificationService.notify(notificationType, message);
    }else {
      this.notificationService.notify(notificationType, 'An error occurred. Please try again. ');
    }
  }


// создаем колоду
  onAddNewDeck() {
    this.refreshing= true;
    const valueElement = this.newDeckForm.value['deckName'];
    const formData = this.cardService.createFormDeck(this.currentUser.email , valueElement,  this.urlForPresent)
    this.subs.add(
      this.cardService.addDeck(formData).subscribe(
        (response: Deck) => {
          this.addDeckToStorage();
          this.urlForPresent = environment.defaultPhoto;
          this.formAdd.nativeElement.reset();
          CardsComponent.clickButton('closeDeck');
          this.sendNotification(NotificationType.SUCCESS,`${response.name}  колода добавленна успешно` );
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message)
        }
      )
    );
    this.refreshing = false;
  }

// добавляк колоды в хранилище
  private addDeckToStorage(){
    this.subs.add(
      this.cardService.getDeck(this.currentUser.email).subscribe(
        (response: Deck[]) =>{
          this.cardService.addDecksToLocalCache(response);
          this.decks = response;
          this.sendNotification(NotificationType.SUCCESS,`${response.length}  колод(ы) загружено для пользователя ${this.currentUser.firstName}` );
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message)
        }

      )
    )
  }
  cleanAddForm() {
    if(this.urlForPresent !== environment.defaultPhoto) {
      if( this.fileName !== undefined && this.fileName !== null){
        this.removePicture(this.urlForPresent);
      }
    }
    this.formAdd.nativeElement.reset();
    this.newDeckForm.reset()
    this.fileName = null;
    this.urlForPresent= environment.defaultPhoto;
  }




  cleanEditForm(){
    this.formEdit.nativeElement.reset();
    this.editDeckForm.reset()
    this.fileName = null;
    this.urlForPresent= environment.defaultPhoto;
  }


// записываем новое фото в сторадж
  public onFileSelected(event): void {
    this.refreshing= true;
    const formData = new FormData();
      this.fileName = event.target.files[0].name;
      this.deckImage = event.target.files[0];
     if(this.urlForPresent !== environment.defaultPhoto ){
       this.removePicture(this.urlForPresent);
     }
      if(this.deckImage){
        formData.append('file', event.target.files[0] );
        this.subs.add(
         this.cardService.addPictureToStorage(formData).subscribe(
         (response: CustomHttpResponse) =>{
           this.urlForPresent = response.message;
           if(this.currentDeck){
             this.changePictureForDeck(this.currentDeck.id, response.message);
           }
           this.formEdit.nativeElement.reset();
           this.refreshing = false;
         },
         (errorResponse: HttpErrorResponse) => {
           this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
           this.refreshing = false;
         }
       )
     )
   }

  }

// меняем фото в базе данных
  private changePictureForDeck(id: string, urlForPresent: string) {
    this.refreshing= true;
    const formData = new FormData();
    formData.append('deckId', id);
    formData.append('newUrl', urlForPresent);
    this.cardService.changePicture(formData).subscribe(
      (response: CustomHttpResponse) => {
              this.addDeckToStorage()
              this.sendNotification(NotificationType.DEFAULT, response.message);
        this.refreshing= false;
            },
      (errorResponse: HttpErrorResponse) => {
        this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
      }
    )
  }




// для удаления фото из стораджа
  private removePicture(urlPicture: string): void {
      const formData = new FormData();
      formData.append('urlPicture', urlPicture);
      this.subs.add(
        this.cardService.removePictureInStorage(formData).subscribe(
          (response: CustomHttpResponse) =>{
            this.sendNotification(NotificationType.DEFAULT, response.message);
          },
          (errorResponse: HttpErrorResponse) => {
            this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
          }
        )
      )
  }

  // удаление колоды из базы и из хранилища


  public deleteDeck(deckId: string): void {
    this.subs.add(
      this.cardService.deleteDeck(this.currentUser.email, deckId).subscribe(
        (response: CustomHttpResponse) =>  {
          this.sendNotification(NotificationType.SUCCESS,   response.message.toLowerCase() );
          this.addDeckToStorage();
          // this.currentDeck =null;
          this.urlForPresent= environment.defaultPhoto;
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message)
        }
      )
    );
  }

  onUploadCurrentDeck(deck: Deck) {
    this.currentDeck = deck;
    this.oldUrlPicture = deck.backOfCardUrl;
    this.urlForPresent = deck.backOfCardUrl;
    this.deckName = deck.name;
  }


  onEditDeck() {
    this.refreshing= true;
    const valueElement = this.editDeckForm.value['replaceNameDeck'];
    const formData = new FormData();
    formData.append('deckId',this.currentDeck.id );
    formData.append('newName', valueElement );
    this.subs.add(
      this.cardService.changeName(formData).subscribe(
        (response: CustomHttpResponse) =>{
          this.sendNotification(NotificationType.DEFAULT, response.message);
          this.refreshing= false;
          this.addDeckToStorage();
          CardsComponent.clickButton('closeEdit');
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
          this.refreshing= true;
        }
      )
    );
  }

  closeEdit() {
    this.outputDeck= this.currentDeck;
    this.outputCards = this.currentDeck.cards;
    CardsComponent.clickButton('closeEdit');
  }

  goToMenu() {
    this.router.navigateByUrl('/user/home');
  }
}
