import { motion } from "framer-motion";
import Image from "next/image";
import IconLogo from './../favicon.ico'

function LoadingSpinner() {
    return (
        <motion.div
          className="flex justify-center items-center h-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="relative w-20 h-20 flex justify-center items-center">
            {/* Ikon Gambar dengan Efek Pulse */}
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="z-10"
            >
              <Image src={IconLogo} alt="Loading Icon" width={50} height={50} />
            </motion.div>
    
            {/* Lingkaran Spinner di Sekitar Ikon */}
            <motion.div
              className="absolute w-32 h-32 border-4 border-t-transparent border-blue-500 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
          </div>
        </motion.div>
      );
}

export default LoadingSpinner;