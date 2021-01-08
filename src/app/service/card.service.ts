import { Injectable } from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient, HttpEvent, HttpResponse} from '@angular/common/http';
import {Observable} from 'rxjs';
import {User} from '../model/user';
import {CustomHttpResponse} from '../model/custom-http-response';
import {Deck} from '../model/deck';
import {Card} from '../model/card';

@Injectable({
  providedIn: 'root'
})
export class CardService {
  private  host = environment.apiUrl;
  constructor(private http: HttpClient) { }

  public addDeck(formData: FormData): Observable<Deck>{
    return this.http.post<Deck>(`${this.host}/deck/add`, formData);
  }
  public getDeck(email: string): Observable<Deck[]>{
    return this.http.get<Deck[]>(`${this.host}/deck/list/${email}`);
  }

  public deleteDeck(email:string, deckId: string ): Observable<CustomHttpResponse>{
    return this.http.delete<CustomHttpResponse>(`${this.host}/deck/delete/${email}/${deckId}`);
  }

  public addCard(formData: FormData): Observable<Card>{
    return this.http.post<Card>(`${this.host}/card/add`, formData);
  }

  public getCards(email: string, deckId: string): Observable<Card[]>{
    return this.http.get<Card[]>(`${this.host}/card/getCards/${email}/${deckId}` );
  }
  public changePicture(formData: FormData): Observable<CustomHttpResponse>{
    return this.http.post<CustomHttpResponse>(`${this.host}/deck/change`, formData);
  }
  public changeName(formData: FormData): Observable<CustomHttpResponse>{
    return this.http.post<CustomHttpResponse>(`${this.host}/deck/change-name`, formData);
  }

  public addPictureToStorage(formData: FormData): Observable<CustomHttpResponse>{
    return this.http.post<CustomHttpResponse>(`${this.host}/drop/addPicture`, formData);
  }

  public removePictureInStorage(formData: FormData): Observable<CustomHttpResponse>{
    return this.http.post<CustomHttpResponse>(`${this.host}/drop/removePicture`, formData);
  }

  public removePictureFromDB(formData: FormData): Observable<CustomHttpResponse>{
    return this.http.post<CustomHttpResponse>(`${this.host}/card/removePictureFromDB`, formData);
  }

  public createFormDeck(loggedEmail: string, nameDeck: string, imageBackCard: string): FormData{
    const formData = new FormData();
    formData.append('loggedEmail', loggedEmail);
    formData.append('nameDeck', nameDeck);
    formData.append('imageBackCard', imageBackCard);
    return formData;
  }

  public addDecksToLocalCache(decks: Deck[]): void{
    localStorage.setItem('decks', JSON.stringify(decks));
  }

  public getDecksFromLocaleCache(): Deck[]{
    if(localStorage.getItem('decks')){
      return  JSON.parse(localStorage.getItem('decks'));
    }
    return null;
  }

}
