'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">jmg-ascensores documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                                <li class="link">
                                    <a href="overview.html" data-type="chapter-link">
                                        <span class="icon ion-ios-keypad"></span>Overview
                                    </a>
                                </li>

                            <li class="link">
                                <a href="index.html" data-type="chapter-link">
                                    <span class="icon ion-ios-paper"></span>
                                        README
                                </a>
                            </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>

                    </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#components-links"' :
                            'data-bs-target="#xs-components-links"' }>
                            <span class="icon ion-md-cog"></span>
                            <span>Components</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="components-links"' : 'id="xs-components-links"' }>
                            <li class="link">
                                <a href="components/AdminLayoutComponent.html" data-type="entity-link" >AdminLayoutComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AIAssistantComponent.html" data-type="entity-link" >AIAssistantComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/App.html" data-type="entity-link" >App</a>
                            </li>
                            <li class="link">
                                <a href="components/BottomNavComponent.html" data-type="entity-link" >BottomNavComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ClientCreateComponent.html" data-type="entity-link" >ClientCreateComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ClientDeleteComponent.html" data-type="entity-link" >ClientDeleteComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ClientEditComponent.html" data-type="entity-link" >ClientEditComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ClientListComponent.html" data-type="entity-link" >ClientListComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ClientRestoreComponent.html" data-type="entity-link" >ClientRestoreComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DocumentDeleteComponent.html" data-type="entity-link" >DocumentDeleteComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DocumentFormComponent.html" data-type="entity-link" >DocumentFormComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DocumentListComponent.html" data-type="entity-link" >DocumentListComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ElevatorCreateComponent.html" data-type="entity-link" >ElevatorCreateComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ElevatorDeleteComponent.html" data-type="entity-link" >ElevatorDeleteComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ElevatorEditComponent.html" data-type="entity-link" >ElevatorEditComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ElevatorListComponent.html" data-type="entity-link" >ElevatorListComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EntityCardComponent.html" data-type="entity-link" >EntityCardComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EquipmentCreateModalComponent.html" data-type="entity-link" >EquipmentCreateModalComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EquipmentDeleteModalComponent.html" data-type="entity-link" >EquipmentDeleteModalComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EquipmentEditModalComponent.html" data-type="entity-link" >EquipmentEditModalComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EquipmentListModalComponent.html" data-type="entity-link" >EquipmentListModalComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/FilterContainerComponent.html" data-type="entity-link" >FilterContainerComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/FilterInputComponent.html" data-type="entity-link" >FilterInputComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/FilterSelectComponent.html" data-type="entity-link" >FilterSelectComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/LoadingSpinnerComponent.html" data-type="entity-link" >LoadingSpinnerComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/LoginComponent.html" data-type="entity-link" >LoginComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MaintenanceChecklistComponent.html" data-type="entity-link" >MaintenanceChecklistComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MaintenanceSchedulingComponent.html" data-type="entity-link" >MaintenanceSchedulingComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MantenimientoFijoModalComponent.html" data-type="entity-link" >MantenimientoFijoModalComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ModalWrapperComponent.html" data-type="entity-link" >ModalWrapperComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/PdfPreviewComponent.html" data-type="entity-link" >PdfPreviewComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/PlaceholderPageComponent.html" data-type="entity-link" >PlaceholderPageComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ProgramacionModalComponent.html" data-type="entity-link" >ProgramacionModalComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ProgrammingComponent.html" data-type="entity-link" >ProgrammingComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ReportsComponent.html" data-type="entity-link" >ReportsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SearchableSelectComponent.html" data-type="entity-link" >SearchableSelectComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SettingsComponent.html" data-type="entity-link" >SettingsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SidebarComponent.html" data-type="entity-link" >SidebarComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SkeletonLoaderComponent.html" data-type="entity-link" >SkeletonLoaderComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/TechnicianCreateComponent.html" data-type="entity-link" >TechnicianCreateComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/TechnicianDeleteComponent.html" data-type="entity-link" >TechnicianDeleteComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/TechnicianEditComponent.html" data-type="entity-link" >TechnicianEditComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/TechnicianListComponent.html" data-type="entity-link" >TechnicianListComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/TechnicianRestoreComponent.html" data-type="entity-link" >TechnicianRestoreComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/WorkerEquipmentComponent.html" data-type="entity-link" >WorkerEquipmentComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/WorkerLayoutComponent.html" data-type="entity-link" >WorkerLayoutComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/WorkerProfileComponent.html" data-type="entity-link" >WorkerProfileComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/WorkerReportCreateComponent.html" data-type="entity-link" >WorkerReportCreateComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/WorkerReportsComponent.html" data-type="entity-link" >WorkerReportsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/WorkerRoutesComponent.html" data-type="entity-link" >WorkerRoutesComponent</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#injectables-links"' :
                                'data-bs-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/AuthService.html" data-type="entity-link" >AuthService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ClientService.html" data-type="entity-link" >ClientService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ConfiguracionService.html" data-type="entity-link" >ConfiguracionService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ElevatorService.html" data-type="entity-link" >ElevatorService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/MantenimientoFijoService.html" data-type="entity-link" >MantenimientoFijoService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/MantenimientoService.html" data-type="entity-link" >MantenimientoService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ProgramacionService.html" data-type="entity-link" >ProgramacionService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ReportService.html" data-type="entity-link" >ReportService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/StorageService.html" data-type="entity-link" >StorageService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TechnicianService.html" data-type="entity-link" >TechnicianService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/WorkerEquipmentService.html" data-type="entity-link" >WorkerEquipmentService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/WorkerService.html" data-type="entity-link" >WorkerService</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/ActualizarProgramacionDTO.html" data-type="entity-link" >ActualizarProgramacionDTO</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ApiResponse.html" data-type="entity-link" >ApiResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ApiResponse-1.html" data-type="entity-link" >ApiResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ApiResponse-2.html" data-type="entity-link" >ApiResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ApiResponse-3.html" data-type="entity-link" >ApiResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Ascensor.html" data-type="entity-link" >Ascensor</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Ascensor-1.html" data-type="entity-link" >Ascensor</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Assignment.html" data-type="entity-link" >Assignment</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AuthResponse.html" data-type="entity-link" >AuthResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Client.html" data-type="entity-link" >Client</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Client-1.html" data-type="entity-link" >Client</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Cliente.html" data-type="entity-link" >Cliente</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Cliente-1.html" data-type="entity-link" >Cliente</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ClienteResumen.html" data-type="entity-link" >ClienteResumen</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ClientGroup.html" data-type="entity-link" >ClientGroup</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ClientStatsResponse.html" data-type="entity-link" >ClientStatsResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CrearMantenimientoDTO.html" data-type="entity-link" >CrearMantenimientoDTO</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CrearMantenimientoFijoDTO.html" data-type="entity-link" >CrearMantenimientoFijoDTO</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CrearProgramacionDTO.html" data-type="entity-link" >CrearProgramacionDTO</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DailyRoute.html" data-type="entity-link" >DailyRoute</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DetalleOrden.html" data-type="entity-link" >DetalleOrden</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DetalleOrden-1.html" data-type="entity-link" >DetalleOrden</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Elevator.html" data-type="entity-link" >Elevator</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Elevator-1.html" data-type="entity-link" >Elevator</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ElevatorApiResponse.html" data-type="entity-link" >ElevatorApiResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ElevatorApiResponse-1.html" data-type="entity-link" >ElevatorApiResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EquipoCliente.html" data-type="entity-link" >EquipoCliente</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Evidence.html" data-type="entity-link" >Evidence</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LoginRequest.html" data-type="entity-link" >LoginRequest</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Mantenimiento.html" data-type="entity-link" >Mantenimiento</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MantenimientoFijo.html" data-type="entity-link" >MantenimientoFijo</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MenuItem.html" data-type="entity-link" >MenuItem</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NavItem.html" data-type="entity-link" >NavItem</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/OrdenTrabajo.html" data-type="entity-link" >OrdenTrabajo</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Programacion.html" data-type="entity-link" >Programacion</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ProgramacionAPI.html" data-type="entity-link" >ProgramacionAPI</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Report.html" data-type="entity-link" >Report</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RouteDetail.html" data-type="entity-link" >RouteDetail</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Schedule.html" data-type="entity-link" >Schedule</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SystemSetting.html" data-type="entity-link" >SystemSetting</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TareaMaestra.html" data-type="entity-link" >TareaMaestra</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Technician.html" data-type="entity-link" >Technician</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TimelineItem.html" data-type="entity-link" >TimelineItem</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Trabajador.html" data-type="entity-link" >Trabajador</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Trabajador-1.html" data-type="entity-link" >Trabajador</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UpdateProfilePayload.html" data-type="entity-link" >UpdateProfilePayload</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/User.html" data-type="entity-link" >User</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Worker.html" data-type="entity-link" >Worker</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/WorkerProfile.html" data-type="entity-link" >WorkerProfile</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/WorkOrder.html" data-type="entity-link" >WorkOrder</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <a data-type="chapter-link" href="routes.html"><span class="icon ion-ios-git-branch"></span>Routes</a>
                        </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});