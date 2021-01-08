import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup, NgForm, Validators,} from '@angular/forms';
import {Deck} from '../model/deck';
import {CardService} from '../service/card.service';
import {User} from '../model/user';
import {environment} from '../../environments/environment';
import {CustomHttpResponse} from '../model/custom-http-response';
import {HttpErrorResponse} from '@angular/common/http';
import {NotificationType} from '../enum/notification-type.enum';
import {SubSink} from 'subsink';
import {NotificationService} from '../service/notification.service';
import {Card} from '../model/card';
import {AuthenticationService} from '../service/authentication.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css']
})
export class CardComponent implements OnInit {
  @ViewChild('form') form: ElementRef;
  @Input() inputDeck: Deck;
  @Input() inputCards: Card[];
  public refreshing: boolean;
  // public currentDeck= new Deck();
  public currentUser: User;
  // public cards: Card[];
  public card= new Card();
  public horizon = false;
  public cardImage: File;
  public currentUrlCard: string;
  private subs = new SubSink();

  public fileName: '';

  constructor(
    private router: Router,
    private cardService: CardService,
    private authenticationService: AuthenticationService,
    private notificationService: NotificationService) { }

  ngOnInit(): void {
    this.currentUrlCard = environment.defaultPhotoFront;
    this.currentUser = this.authenticationService.getUserFromLocalCache();

  }
// сохранить в базу фото
  onAddNewCard(formCard: NgForm) {
    if(this.currentUrlCard !==  environment.defaultPhotoFront){
      this.refreshing = true;
      this.card.horizon = formCard.value;
      const formData = new FormData();
      formData.append('loggedEmail', this.currentUser.email );
      formData.append('deckId', this.inputDeck.id );
      formData.append('imageCard', this.currentUrlCard );
      formData.append('horizon', JSON.stringify(this.horizon ) );
      this.subs.add(
        this.cardService.addCard(formData).subscribe(
          (response: Card) => {
            this.card = response;
            this.inputCards.push(this.card);
            this.refreshing= false;
            this.form.nativeElement.reset();
          },
          (errorResponse: HttpErrorResponse) => {
            this.sendNotification(NotificationType.ERROR, errorResponse.error.message)

          }
        )
      );
      this.fileName = null;
      this.currentUrlCard = environment.defaultPhotoFront;
    }

  }

  private sendNotification(notificationType: NotificationType, message: string): void {
    if(message){
      this.notificationService.notify(notificationType, message);
    }else {
      this.notificationService.notify(notificationType, 'An error occurred. Please try again. ');
    }
  }


// добавление фото в хранилище
  public onFileSelected(event): void {
    this.refreshing= true;
    const formData = new FormData();
    this.fileName = event.target.files[0].name;
    this.cardImage = event.target.files[0];
    if(this.cardImage){
      formData.append('file', event.target.files[0] );
      this.subs.add(
        this.cardService.addPictureToStorage(formData).subscribe(
          (response: CustomHttpResponse) =>{
            this.currentUrlCard = response.message;
            this.refreshing = false;
          },
          (errorResponse: HttpErrorResponse) => {
            this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
            this.refreshing = false;
          }
        ));
    }

  }
  // закрытие и очистка данных если не сохранили
  public cleanCardForm(formCard: NgForm) {
    if(this.currentUrlCard !== environment.defaultPhotoFront) {
      if( this.fileName !== undefined && this.fileName !== null){
        this.removePicture(this.currentUrlCard);
      }
    }
    // formCard.resetForm();
    // formCard.reset();
    // this.formCard.nativeElement.reset();
    // console.log(this.formCard);
    this.currentUrlCard = environment.defaultPhotoFront;
    this.card = new Card();
    this.fileName = null;
    this.refreshing = false;
    // console.log(formCard);
  }
  // удаляем ненужную карту из хранилища
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

  deleteCard(id: string) {
    const formData = new FormData();
    formData.append('loggedEmail', this.currentUser.email);
    formData.append('deckId', this.inputDeck.id);
    formData.append('cardId', id);
    this.subs.add(
      this.cardService.removePictureFromDB(formData).subscribe(
        (response: CustomHttpResponse) =>{
          this.sendNotification(NotificationType.DEFAULT, response.message);
          this.loadListCard(this.inputDeck.id);
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
        }
      )
    )

  }
// загрузка карт из базы
  public loadListCard(deckId: string) {
    this.refreshing = true;
    this.subs.add(
      this.cardService.getCards(this.currentUser.email, deckId).subscribe(
        (response: Card[]) =>{
          this.inputCards = response;
          this.refreshing= false;
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message)
          this.refreshing = false;
        }
      )
    )
  }


  loadInfoForWork() {
    this.loadListCard(this.inputDeck.id);
  }

  goToMenu() {
    this.router.navigateByUrl('/user/home');
  }

}
