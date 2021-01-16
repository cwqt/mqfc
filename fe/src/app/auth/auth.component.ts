import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnInit {
  loading: boolean = false;
  password:string;

  constructor(private http:HttpClient) { }

  ngOnInit(): void {
  }

  authenticate() {
    this.loading = true;
    setTimeout(() => this.loading = false, 1000);
    // this.http
    //   .get(`http://localhost:3000/token`)
    //   .toPromise();
  }
}
