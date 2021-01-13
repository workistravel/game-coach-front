import {Component, ElementRef, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup, NgForm, Validators,} from '@angular/forms';
import {Deck} from '../../model/deck';
import {CardService} from '../../service/card.service';
import {User} from '../../model/user';
import {environment} from '../../../environments/environment';
import {CustomHttpResponse} from '../../model/custom-http-response';
import {HttpErrorResponse} from '@angular/common/http';
import {NotificationType} from '../../enum/notification-type.enum';
import {SubSink} from 'subsink';
import {NotificationService} from '../../service/notification.service';
import {Card} from '../../model/card';
import {AuthenticationService} from '../../service/authentication.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css']
})
export class CardComponent implements OnInit, OnDestroy {
  @ViewChild('form') form: ElementRef;
  @Input() inputDeck: Deck;
  @Input() inputCards: Card[];
  public refreshing: boolean;
  public currentUser: User;
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
  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
// сохранить в базу фото
  onAddNewCard(formCard: NgForm) {
    this.refreshing = true;
    if(this.currentUrlCard !==  environment.defaultPhotoFront){
      this.card.horizon = formCard.value;
      const formData = new FormData();
      formData.append('loggedEmail', this.currentUser.email );
      formData.append('deckId', this.inputDeck.id );
      formData.append('imageCard', this.currentUrlCard );
      formData.append('horizon', JSON.stringify(this.horizon ) );
      this.subs.add(
        this.cardService.addCard(formData).subscribe(
          (response: Card) => {
            this.inputCards.unshift(response);
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
    this.router.navigateByUrl('/home');
  }

  openCard(card: Card) {
    this.card = card;
    this.clickButton('openCard')
  }

  private clickButton(buttonId: string): void{
    document.getElementById(buttonId).click();
  }


}
