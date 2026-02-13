import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../auth/services/user.service';
import { User } from '../../../auth/models/user.model';
import { UserDetailModal } from '../../components/user-detail-modal/user-detail-modal';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [CommonModule, FormsModule, UserDetailModal],
  templateUrl: './manage-users.html',
  styleUrl: './manage-users.scss'
})
export class ManageUsers implements OnInit {
  userService = inject(UserService);
  notificationService = inject(NotificationService);
  cd = inject(ChangeDetectorRef);

  allUsers: User[] = []; // Store all users
  users: User[] = [];    // Store filtered users
  loading = false;

  // Filters
  searchTerm: string = '';
  dateFrom: string = '';
  dateTo: string = '';

  // Modal State
  selectedUser: User | null = null;
  showEditModal = false;

  ngOnInit() {
    this.loadUsers();
  }

  async loadUsers() {
    // Wrap to defer execution and avoid ExpressionChanged check conflict if called from template events
    setTimeout(async () => {
        this.loading = true;
        try {
            const { data, error } = await this.userService.getUsers();
            
            if (error) throw error;
            
            if (!data) {
                this.users = [];
                this.loading = false;
                return;
            }

            // Sort client-side
            this.allUsers = (data as User[]).sort((a, b) => {
                const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                return dateB - dateA;
            });

            this.applyFilters();
            this.cd.detectChanges();

        } catch (error) {
            console.error('Error loading users', error);
            this.notificationService.show('Error al cargar usuarios', 'error');
        } finally {
            this.loading = false;
            this.cd.detectChanges();
        }
    });
  }

  onFilterChange() {
    this.applyFilters();
    this.cd.detectChanges();
  }

  applyFilters() {
    this.users = this.allUsers.filter(u => {
      // 1. Text Search Filter
      if (this.searchTerm) {
        const term = this.searchTerm.toLowerCase();
        const name = (u.full_name || '').toLowerCase();
        const email = (u.email || '').toLowerCase(); 
        if (!name.includes(term) && !email.includes(term)) {
          return false;
        }
      }

      const userDate = u.created_at ? new Date(u.created_at) : new Date(0);
      
      // 2. Date From Filter
      if (this.dateFrom) {
          const fromDate = new Date(this.dateFrom);
          fromDate.setHours(0, 0, 0, 0); 
          if (userDate < fromDate) return false;
      }

      // 3. Date To Filter
      if (this.dateTo) {
          const toDate = new Date(this.dateTo);
          toDate.setHours(23, 59, 59, 999);
          if (userDate > toDate) return false;
      }
      
      return true;
    });
  }

  openEditModal(user: User) {
    this.selectedUser = { ...user }; // Copy to avoid direct mutation
    this.showEditModal = true;
  }

  closeModal() {
    this.showEditModal = false;
    this.selectedUser = null;
  }

  onModalSaved() {
    this.loadUsers(); // Reload to show updates
    // Modal closes itself via close event usually, but we have showEditModal binding
    // UserDetailModal emits saved and close.
    // If it emits close, we close.
    // If it emits saved, we reload.
    // We can also close on save if desired, but let's just reload.
    // The Modal component logic: emits 'saved', then 'close' (in confirmOperation).
  }
}