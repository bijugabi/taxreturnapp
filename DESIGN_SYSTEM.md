# Tax Return App — Design System

## Identidade visual

- **Tom:** Ferramenta profissional para contador. Séria, eficiente, confiável.
- **Estética:** Refined utilitarian — clean, densa de informação, sem ornamentos desnecessários.
- **Inspiração:** Ferramentas financeiras britânicas (Monzo dashboard, GOV.UK design system).

---

## Tipografia

```css
/* Importar no globals.css */
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
```

| Uso | Fonte | Peso | Tamanho |
|-----|-------|------|---------|
| Títulos de página | DM Sans | 600 | 24px |
| Subtítulos / labels | DM Sans | 500 | 14px |
| Corpo / parágrafos | DM Sans | 400 | 14px |
| Valores monetários | DM Mono | 500 | — |
| Badges / tags | DM Mono | 400 | 12px |

**Regra:** Valores em £ sempre em DM Mono. Nunca usar Inter, Roboto ou fontes do sistema.

---

## Paleta de cores

```css
:root {
  /* Backgrounds */
  --bg-base:       #F7F7F5;   /* off-white levemente quente */
  --bg-surface:    #FFFFFF;
  --bg-subtle:     #F0F0ED;

  /* Borders */
  --border:        #E2E2DC;
  --border-strong: #C8C8C0;

  /* Text */
  --text-primary:  #1A1A18;
  --text-secondary:#6B6B63;
  --text-disabled: #A8A8A0;

  /* Accent — verde £ */
  --accent:        #1A7A4A;
  --accent-light:  #E8F5EE;
  --accent-hover:  #155F3A;

  /* Status */
  --success:       #1A7A4A;
  --warning:       #B45309;
  --warning-light: #FEF3C7;
  --error:         #C0392B;
  --error-light:   #FDECEA;

  /* Quarters — identificação rápida */
  --q1:            #3B82F6;   /* azul */
  --q2:            #8B5CF6;   /* roxo */
  --q3:            #F59E0B;   /* âmbar */
  --q4:            #EF4444;   /* vermelho (Q4 = prazo mais tenso) */
}
```

---

## Componentes

### Botão primário

```tsx
// Classe base
className="bg-[#1A7A4A] hover:bg-[#155F3A] text-white text-sm font-medium 
           px-4 py-2 rounded-md transition-colors duration-150"
```

### Botão secundário

```tsx
className="bg-white border border-[#E2E2DC] hover:border-[#C8C8C0] 
           text-[#1A1A18] text-sm font-medium px-4 py-2 rounded-md 
           transition-colors duration-150"
```

### Botão destrutivo

```tsx
className="bg-white border border-[#E2E2DC] hover:bg-[#FDECEA] 
           hover:border-[#C0392B] text-[#C0392B] text-sm font-medium 
           px-4 py-2 rounded-md transition-colors duration-150"
```

### Card / Surface

```tsx
className="bg-white border border-[#E2E2DC] rounded-lg p-5"
```

### Input

```tsx
className="w-full bg-white border border-[#E2E2DC] rounded-md px-3 py-2 
           text-sm text-[#1A1A18] placeholder:text-[#A8A8A0]
           focus:outline-none focus:ring-2 focus:ring-[#1A7A4A] 
           focus:border-transparent transition-all duration-150"
```

### Badge de quarter

```tsx
// Q1
className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono 
           bg-blue-50 text-blue-700 border border-blue-200"

// Adaptar cor com as variáveis --q1, --q2, --q3, --q4
```

### Badge de status

```tsx
// Sucesso
className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs 
           font-medium bg-[#E8F5EE] text-[#1A7A4A]"

// Aviso
className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs 
           font-medium bg-[#FEF3C7] text-[#B45309]"
```

### Valor monetário

```tsx
// Sempre DM Mono para £
<span className="font-mono font-medium text-[#1A1A18]">
  £{value.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
</span>
```

### Tabela

```tsx
<table className="w-full text-sm">
  <thead>
    <tr className="border-b border-[#E2E2DC]">
      <th className="text-left text-xs font-medium text-[#6B6B63] 
                     uppercase tracking-wider py-2 px-4">
        Cliente
      </th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b border-[#F0F0ED] hover:bg-[#F7F7F5] 
                   transition-colors duration-100">
      <td className="py-3 px-4 text-[#1A1A18]">...</td>
    </tr>
  </tbody>
</table>
```

### Área de upload (drag & drop)

```tsx
className="border-2 border-dashed border-[#C8C8C0] rounded-lg p-8 
           text-center cursor-pointer transition-all duration-150
           hover:border-[#1A7A4A] hover:bg-[#E8F5EE]
           data-[dragging=true]:border-[#1A7A4A] 
           data-[dragging=true]:bg-[#E8F5EE]"
```

---

## Layout

### Page container

```tsx
<div className="min-h-screen bg-[#F7F7F5]">
  <main className="max-w-5xl mx-auto px-6 py-8">
    ...
  </main>
</div>
```

### Page header

```tsx
<div className="mb-8">
  <h1 className="text-2xl font-semibold text-[#1A1A18]">Clientes</h1>
  <p className="text-sm text-[#6B6B63] mt-1">75 clientes registrados</p>
</div>
```

### Section divider

```tsx
<div className="border-t border-[#E2E2DC] my-6" />
```

### Navbar

```tsx
<nav className="border-b border-[#E2E2DC] bg-white">
  <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
    {/* Logo */}
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold text-[#1A1A18] tracking-tight">
        Tax Return <span className="text-[#1A7A4A]">·</span> MTD
      </span>
    </div>
    {/* Nav links */}
    <div className="flex items-center gap-6 text-sm text-[#6B6B63]">
      <a href="/" className="hover:text-[#1A1A18] transition-colors">Processar</a>
      <a href="/clients" className="hover:text-[#1A1A18] transition-colors">Clientes</a>
    </div>
  </div>
</nav>
```

### Banner de prazos MTD

```tsx
// Faixa fina no topo mostrando o próximo prazo
<div className="bg-[#1A1A18] text-white text-xs py-2 px-6 
                flex items-center justify-center gap-6">
  {quarters.map(q => (
    <span key={q.name} className="flex items-center gap-2">
      <span className="font-mono text-[#6B6B63]">{q.name}</span>
      <span>{q.period}</span>
      <span className="text-[#1A7A4A] font-medium">→ {q.deadline}</span>
    </span>
  ))}
</div>
```

---

## Regras gerais

- **Sem shadows pesadas** — usar apenas shadow-sm ou bordas para separação
- **Border radius consistente** — rounded-md (6px) para inputs/botões, rounded-lg (8px) para cards
- **Espaçamento em múltiplos de 4** — gap-2, gap-4, gap-6, p-4, p-5, p-6
- **Ícones** — usar exclusivamente lucide-react, tamanho padrão size={16} inline, size={20} em botões isolados
- **Estados de loading** — skeleton com animate-pulse bg-[#F0F0ED], nunca spinners genéricos
- **Números monetários** — sempre font-mono, sempre com toLocaleString('en-GB')
- **Sem gradientes** — paleta flat com hierarquia por peso tipográfico e cor
- **Densidade** — tabelas compactas (py-3 nas linhas), não espaçar demais
