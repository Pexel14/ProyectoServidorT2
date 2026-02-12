import { Component, EventEmitter, Input, Output, inject, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthUser, AuthService } from '../../../core/services/auth.service';
import { StorageService } from '../../../core/services/storage.service';
import { AlertCard, AlertType } from '../alert-card/alert-card';

@Component({
  selector: 'app-edit-profile-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AlertCard],
  templateUrl: './edit-profile-modal.html',
  styleUrl: './edit-profile-modal.scss'
})
export class EditProfileModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() user: AuthUser | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<AuthUser>();

  profileForm: FormGroup;
  loading = false;
  previewUrl: string | null = null;
  selectedFile: File | null = null;
  
  alertVisible = false;
  alertMessage: string | null = null;
  alertType: AlertType = 'success';
  
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private storageService = inject(StorageService);

  constructor() {
    this.profileForm = this.fb.group({
      name: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.updateForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && this.user) {
      this.updateForm();
    }
    if (changes['isOpen'] && !this.isOpen) {
        this.selectedFile = null;
        this.resetAlert();
    }
    if (changes['isOpen'] && this.isOpen && this.user) {
        this.updateForm();
    }
  }

  private updateForm() {
    if (this.user) {
      this.profileForm.patchValue({
        name: this.user.name
      });
      this.previewUrl = this.user.avatar || null;
      this.selectedFile = null;
    }
  }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).className === 'modal-overlay') {
      this.close.emit();
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }
  
  onAlertDismissed() {
    this.alertVisible = false;
  }
  
  resetAlert() {
    this.alertVisible = false;
    this.alertMessage = null;
  }

  async onSubmit() {
    if (this.profileForm.valid) {
      this.loading = true;
      this.resetAlert();
      
      try {
        const { name } = this.profileForm.value;
        let avatarUrl = this.user?.avatar;

        if (this.selectedFile && this.user) {
          const timestamp = new Date().getTime();
          const fileExt = this.selectedFile.name.split('.').pop() || 'jpg';
          const fileName = `avatar_${timestamp}.${fileExt}`;
          const newFile = new File([this.selectedFile], fileName, { type: this.selectedFile.type });
          
          const path = `${this.user.id}`;
          
          const uploadResponse = await this.storageService.uploadFile(newFile, path, { upsert: false });
          avatarUrl = uploadResponse.url;
        }

        const updatedUser = await this.authService.updateProfile(name, avatarUrl);
        
        this.alertType = 'success';
        this.alertMessage = 'Perfil actualizado correctamente';
        this.alertVisible = true;
        
        this.save.emit(updatedUser);
        
        setTimeout(() => {
            this.close.emit();
        }, 1500);
        
      } catch (error: any) {
        console.error(error);
        this.alertType = 'error';
        this.alertMessage = error.message || 'Error al actualizar el perfil';
        this.alertVisible = true;
      } finally {
        this.loading = false;
      }
    }
  }
}

