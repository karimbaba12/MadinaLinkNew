import { Component, OnInit } from '@angular/core';
import { MatDivider } from '@angular/material/divider';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { AuthService } from '../../../Services/Auth/auth.service';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { CardComponent } from '../card/card.component';
@Component({
  selector: 'app-right-toolbar',
  imports: [
    MatMenuTrigger,
    MatMenuModule,
    MatSlideToggle,
    MatDivider,
    NgScrollbarModule,
    CardComponent
  ],
  templateUrl: './right-toolbar.component.html',
  styleUrl: './right-toolbar.component.scss',
})
export class RightToolbarComponent {
  currentUser: any;
  Username: any;
  Email: any;
  constructor(private authService: AuthService) {}
  mainCards = [
    {
      day: 'Today',
      cards: [
        {
          icon: 'custom-layer',
          time: '2 min ago',
          position: 'UI/UX Design',
          description:
            "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley oftype and scrambled it to make a type",
          status: false,
        },
        {
          icon: 'custom-sms',
          time: '1 hour ago',
          position: 'Message',
          description:
            "Lorem Ipsum has been the industry's standard dummy text ever since the 1500.",
          status: false,
        },
      ],
    },
    {
      day: 'Yesterday',
      cards: [
        {
          icon: 'custom-document-text',
          time: '12 hour ago',
          position: 'Forms',
          description:
            "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley oftype and scrambled it to make a type",
          status: false,
        },
        {
          icon: 'custom-security-safe',
          time: '18 hour ago',
          position: 'Security',
          description:
            "Lorem Ipsum has been the industry's standard dummy text ever since the 1500.",
          status: false,
        },
        {
          icon: 'custom-user-bold',
          time: '15 hour ago',
          position: 'Challenge invitation',
          description: 'Jonny aber invites to join the challenge',
          status: true,
        },
      ],
    },
  ];

  notification = [
    {
      sub_title: 'Improvement',
      time: '12 hour ago',
      title: 'Widgets update',
      img: '../../../assets/images/layout/img-announcement-3.png',
    },
    {
      sub_title: 'New Feature',
      time: '18 hour ago',
      title: 'Coming soon dark mode',
      img: '../../../assets/images/layout/img-announcement-4.png',
    },
  ];

  logout() {
    this.authService.logout();
  }
  ngOnInit(): void {
    this.authService.getCurrentUserProfile().subscribe({
      next: (res) => {
        this.currentUser = res.data;
        this.Username = this.currentUser.username;
        this.Email = this.currentUser.email;
      },
      error: (err) => {
        console.error('Failed to load user', err);
      },
    });
  }
}
