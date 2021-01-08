export class User {
  public userId: string;
  public firstName: string;
  public lastName: string;
  public email: string;
  public profileImageUrl: string;
  public lastLoginData: Date;
  public lastLoginDateDisplay: Date;
  public joinDate: Date;
  public role: string;
  public authorities: [];
  public active: boolean;
  public nonLocked: boolean;
  public deck: [];


  constructor() {
    this.firstName = '';
    this.lastName = '';
    this.email = '';
    this.role = '';
    this.authorities = [];
    this.active = false;
    this.nonLocked = false;
    this.deck = [];
  }
}
