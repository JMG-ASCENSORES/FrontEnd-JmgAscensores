import { Component, Input, Output, EventEmitter, signal, computed, ElementRef, HostListener } from '@angular/core';


@Component({
  selector: 'app-searchable-select',
  standalone: true,
  imports: [],
  templateUrl: './searchable-select.component.html',
  styles: []
})
export class SearchableSelectComponent {
  @Input({ required: true }) label: string = '';
  @Input() placeholder: string = 'Buscar...';
  
  private _options = signal<any[]>([]);
  @Input({ required: true }) 
  set options(val: any[]) { this._options.set(val); }
  get options() { return this._options(); }

  @Input() displayFn: (item: any) => string = (item) => item.nombre || '';
  @Input() subDisplayFn?: (item: any) => string;
  @Input() initialSearchValue: string = '';

  @Output() onSelect = new EventEmitter<any>();

  searchTerm = signal('');
  showDropdown = signal(false);

  filteredOptions = computed(() => {
    const query = this.searchTerm().toLowerCase();
    const all = this._options();
    if (!query) return [];
    
    return all.filter(opt => {
      const primary = this.displayFn(opt).toLowerCase();
      const secondary = this.subDisplayFn ? this.subDisplayFn(opt).toLowerCase() : '';
      return primary.includes(query) || secondary.includes(query);
    });
  });

  constructor(private eRef: ElementRef) {
    // Inicializar el valor de búsqueda si se provee
    if (this.initialSearchValue) {
        this.searchTerm.set(this.initialSearchValue);
    }
  }

  onInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchTerm.set(val);
    this.showDropdown.set(true);
  }

  selectOption(opt: any) {
    this.searchTerm.set(this.displayFn(opt));
    this.showDropdown.set(false);
    this.onSelect.emit(opt);
  }

  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.showDropdown.set(false);
    }
  }

  get initials(): (opt: any) => string {
    return (opt: any) => {
        const text = this.displayFn(opt);
        const parts = text.split(' ');
        if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        return text.substring(0, 2).toUpperCase();
    };
  }
}
