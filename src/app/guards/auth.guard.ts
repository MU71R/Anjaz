// import { Injectable } from '@angular/core';
// import { CanActivate, Router } from '@angular/router';
// import { LoginService } from '../service/login.service';

// @Injectable({
//   providedIn: 'root',
// })
// export class AuthGuard implements CanActivate {
//   constructor(private loginService: LoginService, private router: Router) {}

//   canActivate(): boolean {
//     const token = this.loginService.getTokenFromLocalStorage();
//     if (token && !this.loginService.isTokenExpired(token)) {
//       return true;
//     }
//     this.router.navigate(['/login']);
//     return false;
//   }
// }
