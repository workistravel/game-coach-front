export class Deck {
  public id: string;
  public name: string;
  public backOfCardUrl: string;
  public cards: [];
  constructor() {

    this.name = '';
    this.backOfCardUrl= '';
    this.cards = [];
  }
}

