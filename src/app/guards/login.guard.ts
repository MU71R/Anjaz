// import { Injectable } from '@angular/core';
// import { CanActivate, Router, UrlTree } from '@angular/router';
// import { Observable, map } from 'rxjs';
// import { LoginService } from '../service/login.service';

// @Injectable({
//   providedIn: 'root',
// })
// export class LoginGuard implements CanActivate {
//   constructor(private loginService: LoginService, private router: Router) {}

//   canActivate(): Observable<boolean | UrlTree> {
//     return this.loginService.isLoggedIn$.pipe(
//       map((isLoggedIn) => {
//         if (isLoggedIn) {
//           // المستخدم مسجل دخول فعلاً → وده يمنع login
//           // return this.router.createUrlTree(['/login']);
//         }
//         // المستخدم غير مسجل دخول → يسمح بفتح صفحة login
//         return true;
//       })
//     );
//   }
// }
