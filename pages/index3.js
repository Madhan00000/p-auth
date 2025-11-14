import useFetchData from "@/hooks/useFetchData";
import Head from "next/head";
import { FaTelegramPlane, FaDownload, FaFilm, FaHome, FaSearch, FaTv, FaArrowRight } from "react-icons/fa";
import React, { useState, useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from "swiper/react";
import 'swiper/css';
import "swiper/css/autoplay";
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import "swiper/swiper-bundle.css";
import { Pagination, Navigation, Autoplay, FreeMode } from 'swiper/modules';
import Link from "next/link";
import { useRouter } from "next/router";

const Skeleton = ({ width = "100%", height = "100%", className = "" }) => (
  <div
    className={`relative overflow-hidden bg-gray-200 rounded-lg ${className}`}
    style={{ width, height }}
  >
    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
    <style jsx>{`
      @keyframes shimmer {
        0%   { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      .animate-shimmer {
        animation: shimmer 1.5s infinite linear;
      }
    `}</style>
  </div>
);

/* --------------------------------------------------------------
   SKELETON CARD (light-white)
   -------------------------------------------------------------- */
const SkeletonCard = () => (
  <div className="card bg-gray-200 rounded-lg overflow-hidden">
    <Skeleton height="200px" className="aspect-[2/3]" />
    <div className="p-3 space-y-2">
      <Skeleton height="16px" className="w-3/4" />
      <Skeleton height="12px" className="w-1/2" />
    </div>
  </div>
);

/* --------------------------------------------------------------
   SKELETON GENRE ICON
   -------------------------------------------------------------- */
const SkeletonGenre = () => (
  <div className="category-item">
    <div className="icon">
      <Skeleton height="80px" width="80px" className="rounded-full" />
    </div>
  </div>
);

/* --------------------------------------------------------------
   GENRE LIST
   -------------------------------------------------------------- */
const genreList = [
  { name: "action", img: "/img/action.jpg" },
  { name: "adventure", img: "/img/adventure.jpg" },
  { name: "comedy", img: "/img/comedy.jpg" },
  { name: "family", img: "/img/family.jpg" },
  { name: "romance", img: "/img/romance.jpg" },
  { name: "horror", img: "/img/horror.jpg" },
  { name: "crime", img: "/img/crime.jpg" },
  { name: "drama", img: "/img/drama.jpg" },
  { name: "fantasy", img: "/img/fantasy.jpg" },
  { name: "science_fiction", img: "/img/scifi.jpg" },
];

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [searchbar, setSearchbar] = useState(false);
  const [movieshortname, setMovieshortname] = useState("");
  const searchRef = useRef(null);

  /* ---------- simulate app load ---------- */
  useEffect(() => {
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  /* ---------- fetch movies ---------- */
  const { alldata, loading } = useFetchData("/api/getmovies");
  const publishedData = (alldata || []).filter(ab => ab.status === "publish");

  /* ---------- search ---------- */
  const searchResult = movieshortname.trim()
    ? publishedData.filter(m => m.title.toLowerCase().includes(movieshortname.toLowerCase()))
    : [];

  /* ---------- close search on outside click ---------- */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setMovieshortname("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchbarClose = () => setSearchbar(false);

  /* ---------- sticky navbar ---------- */
  useEffect(() => {
    const handleScroll = () => {
      const header = document.querySelector("nav");
      header?.classList.toggle("sticky", window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* ---------- initial app spinner ---------- */
  if (isLoading) {
    return (
      <div className="loader-container">
        <div className="spinner">
          <div className="circle c1"></div>
          <div className="circle c2"></div>
          <div className="circle c3"></div>
          <div className="circle c4"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Cinema Talkiez</title>
        <meta name="description" content="Next Js Movie App" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/img/appicon.jpg" />
      </Head>

      {/* ---------- NAVBAR ---------- */}
      <nav className="header">
        <h1 className="logo1">
          <div className="logo-container">
            <img src="/img/appicon.jpg" alt="Logo" className="logo-img" />
            <span>Cinema Talkiez</span>
          </div>
        </h1>

        <div className="bottom-navigation">
          <ul>
            <li><Link href="/" onClick={handleSearchbarClose}><FaHome /><span>Home</span></Link></li>
            <li><Link href="/Anime" onClick={handleSearchbarClose}><FaTv /><span>Anime</span></Link></li>
            <li><Link href="/search"><FaSearch /><span>Search</span></Link></li>
            <li><Link href="/all" onClick={handleSearchbarClose}><FaFilm /><span>All</span></Link></li>
            <li>
              <a href="https://t.me/+gZwK3ZfUANxiYjk1" target="_blank" rel="noopener noreferrer">
                <FaTelegramPlane /><span>Updates</span>
              </a>
            </li>
          </ul>
        </div>
      </nav>

      <div>
        {/* ---------- HERO SWIPER (light-white skeleton) ---------- */}
        {loading ? (
          <div className="slideimagebx1 relative" style={{ minHeight: '400px' }}>
            <Skeleton className="w-full h-full" />
          </div>
        ) : publishedData.length > 0 ? (
          <Swiper
            autoplay={{ delay: 3000, disableOnInteraction: false }}
            loop={true}
            speed={1200}
            pagination={{ clickable: true }}
            modules={[Pagination, Autoplay, Navigation]}
            onSwiper={(s) => !s.autoplay.running && s.autoplay.start()}
          >
            {publishedData.slice(0, 3).map((movie) => (
              <SwiperSlide key={movie._id}>
                <div className="slideimagebx1">
                  <img src={movie.bgposter} alt={movie.title} loading="lazy" className="bgposter" />
                  <div className="content1">
                    <div className="contentflex1">
                      <div className="smposter1">
                        <img src={movie.smposter} alt={movie.title} loading="lazy" />
                      </div>
                      <div className="details1">
                        <h1>{movie.title}</h1>
                        <Link href={`/movies/${movie.slug}`}>
                          <button className="btn_download1">
                            <FaDownload /> DOWNLOAD
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <p className="text-center py-10 text-white">No movies available</p>
        )}

        {/* ---------- GENRES (smooth swiper + light-white skeleton) ---------- */}
        <h1 className="logo4">Genres</h1>
        <div className="category-icons-scroll">
          {loading ? (
            <Swiper
              slidesPerView={5}
              spaceBetween={30}
              loop
              modules={[FreeMode]}
              freeMode={{ enabled: true }}
              breakpoints={{
                1587: { slidesPerView: 8 },
                1500: { slidesPerView: 7 },
                1200: { slidesPerView: 6 },
                1040: { slidesPerView: 5 },
                768:  { slidesPerView: 4 },
                650:  { slidesPerView: 3 },
                480:  { slidesPerView: 2 },
              }}
            >
              {[...Array(10)].map((_, i) => (
                <SwiperSlide key={i}>
                  <SkeletonGenre />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <Swiper
              modules={[FreeMode, Pagination, Navigation, Autoplay]}
              freeMode={{ enabled: true, momentum: true, momentumRatio: 0.6 }}
              slidesPerView={5}
              spaceBetween={30}
              loop
              grabCursor
              autoplay={{ delay: 4000, disableOnInteraction: false }}
              breakpoints={{
                1587: { slidesPerView: 8 },
                1500: { slidesPerView: 7 },
                1200: { slidesPerView: 6 },
                1040: { slidesPerView: 5 },
                768:  { slidesPerView: 4 },
                650:  { slidesPerView: 3 },
                480:  { slidesPerView: 2 },
              }}
            >
              {genreList.map((g) => (
                <SwiperSlide key={g.name} className="category-item">
                  <Link href={`/${g.name}`} onClick={handleSearchbarClose}>
                    <div className="icon">
                      <img src={g.img} alt={g.name} loading="lazy" />
                    </div>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>

        {/* ---------- NEWLY RELEASED ---------- */}
        <h1 className="logo5">Newly Released</h1>
        <div className="scrollcardssec">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 p-4">
              {[...Array(8)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <Swiper
              slidesPerView={4}
              spaceBetween={50}
              loop={false}
              modules={[Pagination, Navigation, Autoplay]}
              breakpoints={{
                1587: { slidesPerView: 8 },
                1500: { slidesPerView: 7 },
                1200: { slidesPerView: 6 },
                1040: { slidesPerView: 5 },
                768:  { slidesPerView: 4 },
                650:  { slidesPerView: 3 },
                480:  { slidesPerView: 2 },
              }}
            >
              {publishedData.map((movie) => (
                <SwiperSlide key={movie.slug}>
                  <div className="card">
                    <Link href={`/movies/${movie.slug}`}>
                      <div className="cardimg">
                        <img src={movie.smposter} alt={movie.title} loading="lazy" />
                      </div>
                      <div className="contents">
                        <div className="title-row">
                          <h5>{movie.title}</h5>
                          <span className="type">{movie.type}</span>
                        </div>
                      </div>
                    </Link>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>

        {/* ---------- ALL GENRE SECTIONS ---------- */}
        {[
          { title: "Action", genre: "action" },
          { title: "Adventure", genre: "adventure" },
          { title: "Comedy", genre: "comedy" },
          { title: "Love & Romantic", genre: "romance" },
          { title: "Family", genre: "family" },
          { title: "Drama", genre: "drama" },
          { title: "Crime", genre: "crime" },
          { title: "Horror", genre: "horror" },
          { title: "Thriller", genre: "thriller" },
          { title: "Fantasy", genre: "fantasy" },
          { title: "Science-Fiction", genre: "science_fiction" },
        ].map(({ title, genre }) => {
          const filtered = publishedData.filter(m => m.genre.includes(genre));
          return (
            <div key={genre}>
              <h1 className="logo3">{title} Movies</h1>
              <div className="scrollcardssec">
                {loading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 p-4">
                    {[...Array(8)].map((_, i) => (
                      <SkeletonCard key={i} />
                    ))}
                  </div>
                ) : (
                  <Swiper
                    slidesPerView={4}
                    spaceBetween={50}
                    loop={false}
                    autoplay={{ delay: 3000, disableOnInteraction: true }}
                    modules={[Pagination, Navigation, Autoplay]}
                    breakpoints={{
                      1587: { slidesPerView: 8 },
                      1500: { slidesPerView: 7 },
                      1200: { slidesPerView: 6 },
                      1040: { slidesPerView: 5 },
                      768:  { slidesPerView: 4 },
                      650:  { slidesPerView: 3 },
                      480:  { slidesPerView: 2 },
                    }}
                  >
                    {filtered.map((movie) => (
                      <SwiperSlide key={movie.slug}>
                        <div className="card">
                          <Link href={`/movies/${movie.slug}`}>
                            <div className="cardimg">
                              <img src={movie.smposter} alt={movie.title} loading="lazy" />
                            </div>
                            <div className="contents">
                              <div className="title-row">
                                <h5>{movie.title}</h5>
                                <span className="type">{movie.type}</span>
                              </div>
                            </div>
                          </Link>
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                )}
              </div>
            </div>
          );
        })}

        {/* ---------- ALL MOVIES BUTTON ---------- */}
        <div className="nextpagelink">
          <Link href="/all">
            <button className="cssbuttons_io_button">
              All
              <div className="icon"><FaArrowRight /></div>
            </button>
          </Link>
        </div>
      </div>
    </>
  );
}