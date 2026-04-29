'use client';

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
};

export default function ScrollTop() {
    return (
        <button className="w-6 h-7 overflow-hidden text-center cursor-pointer hover:opacity-80 transform active:scale-90 transition-transform" onClick={scrollToTop}>
            <span className="text-3xl font-extralight">⌃</span>
        </button>
    )
}