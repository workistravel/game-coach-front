export class Card {
  public id: string;
  public pictureUrl: string;
  public used: boolean;
  public horizon: boolean;
  constructor() {
    this.pictureUrl = '';
    this.horizon = false;
    this.used = false;
  }
}
