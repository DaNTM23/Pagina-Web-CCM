<script lang="ts">
  import { enhance } from '$app/forms';
  let { data, form } = $props();
  const niveles = $derived([...new Set(data.cursos.map((c) => c.nivel))]);
</script>

<h1>Inscripción CCM</h1>

{#if form?.ok}
  <p><strong>¡Listo!</strong> Tu folio es <code>{form.folio}</code>. Guárdalo: con él consultas tu historial.</p>
{:else if !data.abiertas}
  <p>Las inscripciones están cerradas en este momento.</p>
{:else}
  <p>Costo por curso: ${data.precio} MXN. Inscripciones hasta el {data.fechaFin}.</p>
  <p>
    Paga por transferencia a {data.pago.titular} ({data.pago.banco}), CLABE <code>{data.pago.clabe}</code>,
    cuenta {data.pago.cuenta}. Referencia: {data.pago.referencia}.
  </p>

  {#if form?.error}<p role="alert">{form.error}</p>{/if}

  <form method="POST" enctype="multipart/form-data" use:enhance>
    <label>Nombre completo <input name="nombre" required maxlength="120" /></label>
    <label>Correo <input name="correo" type="email" required maxlength="120" /></label>
    <label>Teléfono / WhatsApp <input name="telefono" required maxlength="30" /></label>
    <label>Curso
      <select name="curso" required>
        <option value="">Elige un curso</option>
        {#each niveles as nivel}
          <optgroup label={nivel}>
            {#each data.cursos.filter((c) => c.nivel === nivel) as c}
              <option value={c.id} disabled={!c.abierto}>
                {c.nombre}{c.abierto ? '' : ` — ${c.mensaje_cerrado || 'No disponible en este periodo'}`}
              </option>
            {/each}
          </optgroup>
        {/each}
      </select>
    </label>
    <label>Comprobante de pago (JPG, PNG o PDF, máx. 5 MB)
      <input name="comprobante" type="file" accept="image/jpeg,image/png,application/pdf" required />
    </label>
    <!-- campo trampa -->
    <input name="sitio_web" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px" />
    <button>Inscribirme</button>
  </form>
{/if}
