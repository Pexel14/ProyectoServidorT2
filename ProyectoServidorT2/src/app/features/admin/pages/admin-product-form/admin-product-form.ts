import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../../products/services/product.service';
import { Product } from '../../../products/models/product.model';
import { StorageService } from '../../../../core/services/storage.service';
import { ConfirmationModalComponent } from '../../../../shared/components/confirmation-modal/confirmation-modal';

@Component({
  selector: 'app-admin-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ConfirmationModalComponent],
  templateUrl: './admin-product-form.html',
  styleUrls: ['./admin-product-form.scss']
})
export class AdminProductForm implements OnInit, OnChanges {
  @Input() product: Product | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  productForm: FormGroup;
  isEditing = false;
  productId: number | null = null;
  pageTitle = 'Nuevo Producto';
  loading = false;
  error = '';
  imagePreview: string | null = null;
  selectedFile: File | null = null;
  showConfirmModal = false;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private storageService: StorageService,
    private cdr: ChangeDetectorRef
  ) {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      price: [0, [Validators.required, Validators.min(0)]],
      quantity: [0, [Validators.required, Validators.min(0)]],
      image: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    if (this.product) {
      this.initFormWithProduct(this.product);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['product'] && this.product) {
       this.initFormWithProduct(this.product);
    } else if (changes['product'] && !this.product) {
        this.resetForm();
    }
  }

  private initFormWithProduct(product: Product) {
    this.isEditing = true;
    this.productId = product.id;
    this.pageTitle = 'Editar Producto';
    this.imagePreview = product.image;
    this.productForm.patchValue({
      name: product.name,
      price: product.price,
      quantity: product.quantity,
      image: product.image
    });
  }

  private resetForm() {
    this.isEditing = false;
    this.productId = null;
    this.pageTitle = 'Nuevo Producto';
    this.imagePreview = 'https://placehold.co/400x300?text=Sin+Imagen';
    this.selectedFile = null;
    this.productForm.reset({
      price: 0,
      quantity: 0,
      image: 'https://placehold.co/400x300?text=Sin+Imagen'
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.productForm.patchValue({ image: file.name }); 
      
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
        this.cdr.detectChanges(); // Force update
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (this.productForm.valid) {
      this.showConfirmModal = true;
    }
  }

  async confirmSave() {
    this.showConfirmModal = false;

    if (this.productForm.invalid) return;

    this.loading = true;
    this.error = '';

    try {
      let imageUrl: string = this.productForm.get('image')?.value || '';

      // ----------------------------
      // Si hay archivo seleccionado
      // ----------------------------
      if (this.selectedFile) {
        const extension = this.selectedFile.name.split('.').pop() || 'jpg';
        // Si estamos editando usamos el id existente, si no, generamos un temporal
        const productIdForFile = this.isEditing && this.productId ? this.productId : 'temp';
        const fileName = `${productIdForFile}.${extension}`;
        const path = `products/`;

        console.log('Subiendo archivo:', path);

        const url = await this.storageService.uploadFile(this.selectedFile, path, {
          bucket: this.storageService.BUCKET_PRODUCTS,
          fileName: fileName,
          upsert: true
        });

        imageUrl = url.url;

        console.log('URL pública obtenida:', imageUrl);
      }

      // ----------------------------
      // Datos del producto a guardar
      // ----------------------------
      const productData: Omit<Product, 'id'> = {
        name: this.productForm.value.name || '',
        price: this.productForm.value.price ?? 0,
        quantity: this.productForm.value.quantity ?? 0,
        image: imageUrl
      };

      // ----------------------------
      // Crear o actualizar en DB
      // ----------------------------
      if (this.isEditing && this.productId) {
        await this.productService.updateProduct(this.productId, productData);
      } else {
        await this.productService.createProduct(productData);
      }

      this.saved.emit();

    } catch (err: any) {
      this.error = this.isEditing
        ? 'Error al actualizar el producto'
        : 'Error al crear el producto';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }


  cancelSave() {
    this.showConfirmModal = false;
  }

  closeModal(): void {
    this.close.emit();
  }

  onImageError(event: any) {
    event.target.src = 'https://placehold.co/400x300?text=Sin+Imagen';
  }
}
