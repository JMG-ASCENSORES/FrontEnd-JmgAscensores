import { LucideAngularModule } from 'lucide-angular';
import { Component, Input, Output, EventEmitter, computed, signal } from '@angular/core';


@Component({
  selector: 'app-maintenance-checklist',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './maintenance-checklist.component.html',
  styles: []
})
export class MaintenanceChecklistComponent {
  private _items = signal<any[]>([]);
  @Input({ required: true }) 
  set items(val: any[]) { this._items.set(val); }
  get items() { return this._items(); }

  @Input() loading: boolean = false;

  @Output() taskToggle = new EventEmitter<any>();
  @Output() categoryToggle = new EventEmitter<{ group: any, checked: boolean }>();

  groupedChecklist = computed(() => {
    const list = this._items();
    const groups: { categoria: string, tasks: any[] }[] = [];
    
    list.forEach(item => {
      const categoria = item.categoria || item.TareaMaestra?.categoria || 'VARIOS';
      let group = groups.find(g => g.categoria === categoria);
      if (!group) {
        group = { categoria, tasks: [] };
        groups.push(group);
      }
      group.tasks.push(item);
    });

    return groups;
  });

  toggleTask(task: any) {
    this.taskToggle.emit(task);
  }

  toggleCategory(group: any, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.categoryToggle.emit({ group, checked: isChecked });
  }

  isCategoryComplete(group: { categoria: string, tasks: any[] }): boolean {
    if (!group.tasks || group.tasks.length === 0) return false;
    return group.tasks.every(t => t.realizado);
  }

  trackByGroup(index: number, group: any): string {
    return group.categoria;
  }

  trackByTask(index: number, task: any): number {
    return task.tarea_maestra_id || task.tarea_id;
  }
}
