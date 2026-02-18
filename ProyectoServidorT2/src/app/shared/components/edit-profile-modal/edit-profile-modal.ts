import { ChangeDetectorRef, Component, EventEmitter, Input, Output, inject, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthUser, AuthService } from '../../../core/services/auth.service';
import { StorageService } from '../../../core/services/storage.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-edit-profile-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
  
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private storageService = inject(StorageService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

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
        // FileReader runs outside Angular zone; force change detection
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }
  
  async onSubmit() {
    if (this.profileForm.valid && !this.loading) {
      this.loading = true;
      
      try {
        const { name } = this.profileForm.value;
        let avatarUrl = this.user?.avatar;

        if (this.selectedFile && this.user) {
          const timestamp = new Date().getTime();
          const fileExt = this.selectedFile.name.split('.').pop() || 'jpg';
          const fileName = `avatar_${timestamp}.${fileExt}`;
          const path = `${this.user.id}`;

          // upsert:true so re-uploading an avatar to the same path never errors
          const uploadResponse = await this.storageService.uploadFile(this.selectedFile, path, {
            upsert: true,
            fileName
          });
          // Add cache-busting query param so browser always shows the new image
          avatarUrl = uploadResponse.url + '?t=' + Date.now();
        }

        const updatedUser = await this.authService.updateProfile(name, avatarUrl);

        this.notificationService.show('Perfil actualizado correctamente', 'success');

        // Close first to avoid getting stuck if any parent listener throws.
        this.close.emit();

        try {
          this.save.emit(updatedUser);
        } catch (emitError) {
          console.error('Error propagating profile update event', emitError);
        }

        window.dispatchEvent(new CustomEvent('user-profile-updated'));
        
      } catch (error: any) {
        console.error(error);
        this.notificationService.show(error.message || 'Error al actualizar el perfil', 'error');
      } finally {
        this.loading = false;
      }
    }
  }
}

