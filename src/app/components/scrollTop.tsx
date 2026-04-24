'use client';

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
};

export default function ScrollTop() {
    return (
        <button className="w-6 h-6 overflow-hidden text-center cursor-pointer" onClick={scrollToTop}>
            <span className="text-2xl font-light">⌃</span>
        </button>
    )
}