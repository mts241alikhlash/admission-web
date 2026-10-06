<template>
  <section
    class="school-stories"
    aria-labelledby="stories-title"
  >
    <div class="stories-inner">
      <div class="stories-heading">
        <p class="stories-label">Cerita dari keluarga Al-Ikhlash</p>
        <h2 id="stories-title">Yang tinggal,<br />bukan hanya kenangan.</h2>
        <p class="stories-note">
          Pratinjau testimoni. Kutipan, nama, dan foto akan diisi setelah cerita
          asli serta izin publikasi tersedia.
        </p>
      </div>
      <div class="stories-layout">
        <article class="story-feature">
          <p class="story-kind">Cerita alumni <span>Placeholder</span></p>
          <p class="story-quote">
            [Kutipan alumni tentang pengalaman belajar dan momen yang paling
            berkesan di Al-Ikhlash.]
          </p>
          <div class="story-person">
            <div class="story-photo">Foto<br />alumni</div>
            <p>[Nama alumni]<span>[Tahun kelulusan]</span></p>
          </div>
        </article>
        <article class="story-parent">
          <p class="story-kind">Cerita orang tua <span>Placeholder</span></p>
          <p class="story-quote">
            [Cerita orang tua tentang mendampingi putra atau putrinya selama
            bersekolah di Al-Ikhlash.]
          </p>
          <div class="story-person">
            <div class="story-photo">Foto<br />orang tua</div>
            <p>[Nama orang tua]<span>[Keterangan narasumber]</span></p>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.school-stories {
  background: #f5f2e9;
  color: #162d53;
}
.stories-inner {
  max-width: 80rem;
  margin: auto;
  padding: 3.5rem 1.25rem;
}
.stories-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #475569;
}
h2 {
  margin-top: 1.25rem;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2.4rem, 4.5vw, 4rem);
  font-weight: 400;
  line-height: 1.08;
  letter-spacing: -0.045em;
}
.stories-note {
  max-width: 24rem;
  margin-top: 1.25rem;
  font-size: 0.8125rem;
  line-height: 1.8;
  color: #475569;
}
.stories-layout {
  display: grid;
  margin-top: 2rem;
  gap: 1.5rem;
}
.story-feature {
  padding: 1.75rem;
  background: #203f73;
  color: #fff;
}
.story-parent {
  padding: 1.75rem 0;
}
.story-kind {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
}
.story-kind span {
  font-size: 0.625rem;
  font-weight: 400;
  border: 1px solid currentColor;
  padding: 0.2rem 0.4rem;
}
.story-quote {
  margin-top: 1.75rem;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(1.45rem, 2.6vw, 2rem);
  line-height: 1.4;
}
.story-person {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  font-size: 0.8125rem;
}
.story-person p span {
  display: block;
  margin-top: 0.3rem;
  font-size: 0.6875rem;
}
.story-photo {
  flex-shrink: 0;
  display: grid;
  place-content: center;
  width: 3rem;
  height: 3.5rem;
  border: 1px dashed currentColor;
  text-align: center;
  font-size: 0.5625rem;
}
@media (min-width: 640px) {
  .stories-inner {
    padding: 4.5rem 2rem;
  }
  .stories-layout {
    grid-template-columns: 1.15fr 0.85fr;
    gap: 2rem;
    align-items: center;
  }
}
@media (min-width: 1024px) {
  .stories-inner {
    padding-block: 6rem;
  }
  .stories-heading {
    display: grid;
    grid-template-columns: 1.15fr 0.85fr;
    column-gap: 4rem;
    align-items: end;
  }
  .stories-label {
    grid-column: 1 / -1;
  }
  .stories-layout {
    gap: 4rem;
    margin-top: 3rem;
  }
  .story-feature {
    padding: 3rem;
  }
  .story-person {
    margin-top: 2.5rem;
  }
}
</style>
