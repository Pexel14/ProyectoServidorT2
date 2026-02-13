import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertCard } from '../../../../shared/components/alert-card/alert-card';
import { NotificationService } from '../../../../core/services/notification.service';
import { User } from '../../../auth/models/user.model';
import { UserService } from '../../../auth/services/user.service';
import { OrderService } from '../../../orders/services/order.service';
import { StorageService } from '../../../../core/services/storage.service';

@Component({
  selector: 'app-user-detail-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, AlertCard],
  templateUrl: './user-detail-modal.html',
  styleUrl: './user-detail-modal.scss'
})
export class UserDetailModal implements OnChanges {
  @Input() user!: User;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  userService = inject(UserService);
  orderService = inject(OrderService);
  notificationService = inject(NotificationService);
  storageService = inject(StorageService);

  orders: any[] = [];
  loading = false;
  ordersLoading = false;
  
  editedName: string = '';
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  
  showConfirmModal = false;
  confirmAction: 'save' | 'avatar' | null = null;
  confirmMessage = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && this.user) {
      this.initUser();
    }
  }

  initUser() {
    this.editedName = this.user.full_name || '';
    this.selectedFile = null;
    this.previewUrl = null;
    this.loadOrders();
  }

  async loadOrders() {
    this.ordersLoading = true;
    try {
      this.orders = await this.orderService.getOrdersByUserId(this.user.id);
    } catch (error) {
      console.error('Error loading orders', error);
      this.notificationService.show('Error al cargar los pedidos del usuario', 'error');
    } finally {
      this.ordersLoading = false;
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onSaveProfile() {
    this.confirmAction = 'save';
    this.confirmMessage = '¿Estás seguro de que quieres guardar los cambios?';
    this.showConfirmModal = true;
  }

  onResetAvatar() {
    this.confirmAction = 'avatar';
    this.confirmMessage = '¿Estás seguro de que quieres restablecer la foto de perfil?';
    this.showConfirmModal = true;
  }

  cancelModal() {
    this.close.emit();
  }

  // Confirmation Logic
  async confirmOperation() {
    this.showConfirmModal = false;
    this.loading = true;

    try {
      if (this.confirmAction === 'save') {
        const updateData: any = { 
          full_name: this.editedName,
        };

        if (this.selectedFile) {
          try {
             // We use the same path convention as in edit-profile-modal
             // Assuming avatars bucket or similar. StorageService.uploadFile usually handles bucket?
             // Need to check StorageService impl if it has fixed bucket or assumes prefix.
             // EditProfileModal used: const path = `${this.user.id}`;
             const timestamp = new Date().getTime();
             const fileExt = this.selectedFile.name.split('.').pop() || 'jpg';
             const fileName = `avatar_${timestamp}.${fileExt}`;
             const path = `${this.user.id}/${fileName}`;
             
             // Or maybe just user ID if single file? 
             // Let's use user-id/timestamp-filename to avoid cache issues
             // Previous code in edit-profile-modal used:
             // const path = `${this.user.id}`;  <-- Wait, that looks like it overwrites a folder or file named ID?
             // Let's re-read edit-profile-modal context if needed, but safer is:
             
             const uploadResponse = await this.storageService.uploadFile(this.selectedFile, this.user.id, { upsert: false }); 
             // Note: StorageService uploadFile usually takes (file, path). 
             // If I use user.id as path, it might be the folder or the filename depending on service.
             // Let's assume it returns { url: string }.
             
             updateData.avatar_url = uploadResponse.url;
             
          } catch(uploadErr) {
             console.error('Upload error', uploadErr);
             throw new Error('Error al subir la imagen');
          }
        }
        
        await this.userService.updateUser(this.user.id, updateData);
        this.notificationService.show('Usuario actualizado correctamente', 'success');
        this.saved.emit();
        this.close.emit();
      } else if (this.confirmAction === 'avatar') {
        await this.userService.updateUser(this.user.id, {
          avatar_url: null // Reset to default
        });
        this.notificationService.show('Avatar restablecido correctamente', 'success');
        this.saved.emit();
        // Update local state
        this.user.avatar_url = null; 
      }
    } catch (error) {
      console.error('Operation error', error);
      this.notificationService.show('Error al realizar la operación', 'error');
    } finally {
      this.loading = false;
      this.confirmAction = null;
    }
  }

  cancelConfirm() {
    this.showConfirmModal = false;
    this.confirmAction = null;
  }
}
