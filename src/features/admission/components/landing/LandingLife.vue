<template>
  <section
    id="kehidupan"
    class="school-life scroll-mt-20"
    aria-labelledby="school-life-title"
  >
    <div class="life-intro">
      <p class="life-label">Mengenal Al-Ikhlash</p>
      <h2 id="school-life-title">Ada cerita<br />di setiap sudutnya.</h2>
      <p class="life-description">
        Sebelum menjadi bagian dari Al-Ikhlash, lihat lebih dekat suasana yang
        akan menjadi bagian dari cerita sekolahmu.
      </p>
    </div>
    <div class="life-spread">
      <figure class="life-school landing-photo-reveal">
        <div class="life-image">
          <img
            src="/bg.webp"
            alt="Kebersamaan santri dan guru di halaman Al-Ikhlash"
            width="1150"
            height="661"
            loading="lazy"
          />
        </div>
        <figcaption>
          <span>Keseharian di Al-Ikhlash</span><span>Dokumentasi sekolah</span>
        </figcaption>
      </figure>
      <figure class="life-books landing-photo-reveal">
        <div class="life-image">
          <img
            src="/landing-library.jpg"
            alt="Ilustrasi rak buku untuk area cerita kegiatan belajar"
            width="1000"
            height="586"
            loading="lazy"
          />
        </div>
        <figcaption>
          <span>Membuka halaman baru</span
          ><span>Foto ilustrasi · Unsplash</span>
        </figcaption>
      </figure>
    </div>
    <div class="life-footnote">
      <p>Setiap perjalanan dimulai dengan mengenal.</p>
      <a href="#gelombang">Lihat jadwal pendaftaran</a>
    </div>
  </section>
</template>

<style scoped>
.school-life {
  max-width: 80rem;
  margin: auto;
  padding: 3.5rem 1.25rem;
  color: #162d53;
}
.life-intro {
  display: grid;
  gap: 1.25rem;
}
.life-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #475569;
}
h2 {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2.4rem, 4.5vw, 4rem);
  font-weight: 400;
  line-height: 1.08;
  letter-spacing: -0.045em;
}
.life-description {
  max-width: 23rem;
  font-size: 0.9375rem;
  line-height: 1.85;
  color: #475569;
}
.life-spread {
  display: grid;
  gap: 2rem;
  margin-top: 2rem;
}
.life-image {
  overflow: hidden;
  background: #e8e2d4;
}
.life-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.life-school .life-image {
  aspect-ratio: 1.5;
}
.life-books .life-image {
  aspect-ratio: 1.65;
}
figcaption {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.25rem 1rem;
  margin-top: 0.875rem;
  font-size: 0.8125rem;
}
figcaption span:last-child {
  font-size: 0.6875rem;
  color: #475569;
}
.life-footnote {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 2rem;
}
.life-footnote p {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.25rem;
}
.life-footnote a {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  border-bottom: 1px solid #203f73;
  font-size: 0.8125rem;
  font-weight: 600;
}
.life-footnote a:focus-visible {
  outline: 2px solid #203f73;
  outline-offset: 4px;
}
@media (min-width: 640px) {
  .school-life {
    padding: 4.5rem 2rem;
  }
  .life-intro {
    grid-template-columns: 1.2fr 0.8fr;
    align-items: end;
    gap: 1.25rem 2rem;
  }
  .life-label {
    grid-column: 1 / -1;
  }
  .life-spread {
    grid-template-columns: 1.4fr 0.8fr;
    align-items: end;
  }
  .life-books {
    margin-bottom: 2.5rem;
  }
  .life-books .life-image {
    aspect-ratio: 0.78;
  }
  .life-footnote {
    margin-top: 2.5rem;
  }
}
@media (min-width: 1024px) {
  .school-life {
    padding-block: 6.5rem;
  }
  .life-intro {
    grid-template-columns: 1.4fr 0.8fr;
    gap: 1.5rem 4rem;
  }
  .life-spread {
    margin-top: 3.5rem;
    gap: 4rem;
  }
  .life-books {
    margin-bottom: 3rem;
  }
}
</style>
