# Testing Guide - JMG Ascensores Frontend

## 🚀 Inicio Rápido

```bash
npm test
```

Esto ejecuta todos los tests con **Vitest**.

---

## 📚 Qué se testea y por qué

### Nivel 1: Unit Tests (Tests Unitarios) ✅

Son los que escribimos. Son **rápidos**, **baratos** y **aíslan lógica pura**.

**Testean:**
- Servicios puros (sin HTTP, sin DOM)
- Lógica de negocio
- Transformaciones de datos
- Comportamiento de componentes (NO rendering)

**NO testean:**
- Rendering del HTML (eso es E2E)
- Estilos CSS
- Clicks del DOM

---

## 📂 Estructura de Tests

Cada archivo `.ts` tiene un `.spec.ts` correspondiente:

```
src/app/
├── core/
│   └── services/
│       ├── auth.service.ts
│       └── auth.service.spec.ts        ← Tests para AuthService
├── features/
│   └── auth/
│       └── login/
│           ├── login.component.ts
│           └── login.component.spec.ts  ← Tests para LoginComponent
```

---

## 🎯 Patrones de Testing

### Patrón 1: Tests de Servicios

```typescript
describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let storageServiceMock: any;

  beforeEach(() => {
    // 1. Crear mocks de dependencias
    storageServiceMock = {
      saveToken: vi.fn(),
      getUser: vi.fn(() => null),
      // ... otros métodos
    };

    // 2. Configurar TestBed
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: StorageService, useValue: storageServiceMock }
      ]
    });

    // 3. Inyectar servicios
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Verificar que no hay requests HTTP pendientes
  });

  it('should save token when login succeeds', () => {
    const credentials = { dni: '12345678', contrasena: 'password' };
    let receivedUser: User | undefined;

    // 4. Ejecutar el método
    service.login(credentials).subscribe((user) => {
      receivedUser = user;
    });

    // 5. Responder la request HTTP
    const req = httpMock.expectOne(`${apiUrl}/auth/login`);
    req.flush(mockAuthResponse);

    // 6. Verificar resultados
    expect(storageServiceMock.saveToken).toHaveBeenCalledWith('token123');
    expect(receivedUser).toEqual(mockUser);
  });
});
```

### Patrón 2: Tests de Componentes

```typescript
describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceMock: any;

  beforeEach(async () => {
    // 1. Crear mocks de dependencias
    authServiceMock = {
      login: vi.fn().mockReturnValue(of(mockUser))
    };

    // 2. Configurar TestBed
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock }
      ]
    }).compileComponents();

    // 3. Crear componente
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should call authService.login when form is valid', () => {
    // 4. Setear el form
    component.loginForm.setValue({
      dni: '12345678',
      contrasena: 'password'
    });

    // 5. Ejecutar
    component.onSubmit();

    // 6. Verificar
    expect(authServiceMock.login).toHaveBeenCalledWith({
      dni: '12345678',
      contrasena: 'password'
    });
  });
});
```

---

## 🧪 Tecnologías Usadas

- **Vitest**: Framework de testing (rápido, moderno)
- **Vitest + Angular TestBed**: Para testing de servicios y componentes
- **HttpClientTestingModule**: Para mockear requests HTTP

---

## 📝 Cómo Escribir Más Tests

### Paso 1: Identifica QUÉ testear

Pregúntate:
- ¿Si esto fallara, se cae la app?
- ¿Hay múltiples caminos (happy path + error cases)?
- ¿Hay state que cambia?

Si la respuesta es SÍ → **escribe un test**.

### Paso 2: Estructura

```typescript
describe('NombreDelServicio/Componente', () => {
  // Setup
  beforeEach(() => {
    // Crear mocks
    // Configurar TestBed
    // Inyectar servicios
  });

  // Tests organizados por funcionalidad
  describe('metodoPrincipal()', () => {
    it('debería hacer algo cuando X ocurre', () => {
      // Arrange: preparar datos
      // Act: ejecutar
      // Assert: verificar
    });
  });
});
```

### Paso 3: Patrones Comunes

#### 3a. Mock de servicio HTTP

```typescript
service.login(credentials).subscribe();
const req = httpMock.expectOne(`${apiUrl}/auth/login`);
req.flush(mockResponse); // Responder exitosamente
// req.error(new ErrorEvent('Network error')); // O un error
```

#### 3b. Mock de función con vi.fn()

```typescript
const mockFn = vi.fn();
mockFn.mockReturnValue(expectedValue);
mockFn.mockImplementation((arg) => arg + 1);

// Verificar que fue llamado
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith(expectedValue);
```

#### 3c. Testear observables

```typescript
let result: any;
service.method().subscribe((data) => {
  result = data;
});
// ... hacer que el observable emita ...
expect(result).toEqual(expected);
```

---

## 🚦 Checklist para Escribir Buenos Tests

- [ ] El test tiene un nombre descriptivo
- [ ] El test verifica **UNA** cosa principal
- [ ] Hay setup adecuado (mocks, TestBed)
- [ ] Se verifica el resultado esperado
- [ ] Se cleanup (httpMock.verify())
- [ ] El test es independiente de otros tests
- [ ] El test es rápido (< 100ms)

---

## 🎯 Prioridad de Qué Testear

1. **Servicios críticos** (auth, data)
2. **Guards** (seguridad)
3. **Transformaciones de datos** (pipes, converters)
4. **Componentes con lógica** (login, formularios)
5. **Componentes visuales** (buttons, lists)

---

## 📚 Recursos

- [Vitest Docs](https://vitest.dev/)
- [Angular Testing](https://angular.io/guide/testing)
- [TestBed](https://angular.io/api/core/testing/TestBed)
- [HttpClientTestingModule](https://angular.io/api/common/http/testing/HttpClientTestingModule)

---

## ❓ Preguntas Comunes

**P: ¿Por qué usamos `setValue` en lugar de `patchValue`?**
R: `setValue` requiere valores para TODOS los campos, así garantizamos que el form sea válido. `patchValue` solo actualiza campos específicos.

**P: ¿Qué es `vi.fn()`?**
R: Es la forma de crear un "spy" (función que registra llamadas) en Vitest. Reemplaza a `jasmine.createSpyObj` del viejo framework.

**P: ¿Cuándo usar `beforeEach` vs `before`?**
R: `beforeEach` se ejecuta ANTES de cada test. Úsalo para resetear mocks. `before` se ejecuta UNA VEZ. Casi siempre usas `beforeEach`.

**P: ¿Necesito testear el HTML?**
R: No para unit tests. Eso es para E2E tests (Playwright). Un unit test verifica la LÓGICA, no el rendering.
