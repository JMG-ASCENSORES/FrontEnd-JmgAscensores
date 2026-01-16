import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientService, Client, Elevator } from '../services/client.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.scss'] // We can reuse styles or just use Tailwind
})
export class ClientsComponent implements OnInit {
  private clientService = inject(ClientService);

  // State Signals
  clients = signal<Client[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  // Filters
  searchQuery = signal('');
  selectedType = signal('');
  selectedBrand = signal(''); // Placeholder filter
  selectedDistrict = signal(''); // Placeholder filter

  // Mock Data for filters (matches design)
  types = ['Corporativo', 'Residencial', 'Gobierno'];
  brands = ['Schindler', 'Otis', 'Thyssenkrupp', 'Orona'];
  districts = ['San Isidro', 'Miraflores', 'Surco', 'Lima'];

  ngOnInit() {
    this.loadClients();
  }

  loadClients() {
    this.isLoading.set(true);
    this.error.set(null);
    
    forkJoin({
      clients: this.clientService.getClients(),
      elevators: this.clientService.getElevators()
    }).subscribe({
      next: ({ clients, elevators }) => {
        // Map elevators to clients
        const enhancedData = clients.map(client => {
          const clientElevators = elevators.filter(e => e.cliente_id === client.cliente_id && e.tipo_equipo.toLowerCase() === 'ascensor'); // Filter only Ascensores if needed, or all equipment depending on requirement. User said "ascensores".
          // Actually user said "cuantos ascensores tiene cada cliente". The API returns "tipo_equipo": "Ascensor" or "Montacargas". 
          // Let's count all "Ascensor" type.
          
          return {
            ...client,
            ascensores_count: clientElevators.length
          };
        });

        this.clients.set(enhancedData);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Error al cargar los datos.');
        this.isLoading.set(false);
      }
    });
  }

  // Computed
  filteredClients = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const type = this.selectedType();
    
    return this.clients().filter(client => {
      const matchQuery = (client.nombre_comercial || client.contacto_nombre || '').toLowerCase().includes(query) ||
                         (client.ruc || '').includes(query) ||
                         (client.dni || '').includes(query);
      const matchType = type ? client.tipo_cliente === type : true;
      
      return matchQuery && matchType;
    });
  });

  totalClients = computed(() => this.clients().length);
  totalEquipments = computed(() => this.clients().reduce((acc, curr) => acc + (curr.ascensores_count || 0), 0));

  // Actions
  openNewClientModal() {
    console.log('Open new client modal');
  }

  deleteClient(id: number) {
    if(confirm('¿Estás seguro de eliminar este cliente?')) {
        console.log('Delete client', id);
        // Call service delete
    }
  }

  editClient(client: Client) {
    console.log('Edit client', client);
  }
}
