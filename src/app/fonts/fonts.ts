import { Syncopate, Noto_Sans, Noto_Emoji } from 'next/font/google';
import localFont from 'next/font/local';

export const syncopate = Syncopate({ weight: ['400','700'], subsets: ['latin'] });
export const notoSans = Noto_Sans({ weight: ['300','400','500','600','700','800'], subsets: ['latin'] });
export const notoEmoji = Noto_Emoji({ weight: ['400'] });

export const juliaMono = localFont({
  src: [
    { path: './JuliaMono/JuliaMono-Light.woff2',           weight: '300', style: 'normal' },
    { path: './JuliaMono/JuliaMono-LightItalic.woff2',     weight: '300', style: 'italic' },
    { path: './JuliaMono/JuliaMono-Regular.woff2',         weight: '400', style: 'normal' },
    { path: './JuliaMono/JuliaMono-RegularLatin.woff2',    weight: '400', style: 'normal' },
    { path: './JuliaMono/JuliaMono-RegularItalic.woff2',   weight: '400', style: 'italic' },
    { path: './JuliaMono/JuliaMono-Medium.woff2',          weight: '500', style: 'normal' },
    { path: './JuliaMono/JuliaMono-MediumItalic.woff2',    weight: '500', style: 'italic' },
    { path: './JuliaMono/JuliaMono-SemiBold.woff2',        weight: '600', style: 'normal' },
    { path: './JuliaMono/JuliaMono-SemiBoldItalic.woff2',  weight: '600', style: 'italic' },
    { path: './JuliaMono/JuliaMono-Bold.woff2',            weight: '700', style: 'normal' },
    { path: './JuliaMono/JuliaMono-BoldLatin.woff2',       weight: '700', style: 'normal' },
    { path: './JuliaMono/JuliaMono-BoldItalic.woff2',      weight: '700', style: 'italic' },
    { path: './JuliaMono/JuliaMono-ExtraBold.woff2',       weight: '800', style: 'normal' },
    { path: './JuliaMono/JuliaMono-ExtraBoldItalic.woff2', weight: '800', style: 'italic' },
    { path: './JuliaMono/JuliaMono-Black.woff2',           weight: '900', style: 'normal' },
    { path: './JuliaMono/JuliaMono-BlackItalic.woff2',     weight: '900', style: 'italic' },
  ],
  variable: '--font-julia-mono',
  display: 'swap',
});

