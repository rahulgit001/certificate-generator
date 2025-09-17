import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';

const CertificateGenerator = () => {
  const [formData, setFormData] = useState({
    name: '',
    enrollmentDate: '',
    endDate: '',
    signature: '',
    certificateNumber: 'CERT-' + Math.floor(10000 + Math.random() * 90000)
  });
  
  const [signatureType, setSignatureType] = useState('digital');
  const [digitalSignature, setDigitalSignature] = useState('');
  const [handwrittenSignature, setHandwrittenSignature] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const signatureCanvasRef = useRef(null);
  const certificateRef = useRef(null);
  const barcodeRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSignatureTypeChange = (type) => {
    setSignatureType(type);
    setDigitalSignature('');
    setHandwrittenSignature(null);
    clearSignatureCanvas();
  };

  const clearSignatureCanvas = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const startDrawing = (e) => {
    if (signatureType !== 'handwritten') return;
    
    const canvas = signatureCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    ctx.beginPath();
    ctx.moveTo(
      e.clientX - rect.left,
      e.clientY - rect.top
    );
    
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = signatureCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    ctx.lineTo(
      e.clientX - rect.left,
      e.clientY - rect.top
    );
    
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    
    const canvas = signatureCanvasRef.current;
    setHandwrittenSignature(canvas.toDataURL());
    setIsDrawing(false);
  };

  const handleGenerate = () => {
    if (!formData.name || !formData.enrollmentDate || !formData.endDate) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (signatureType === 'digital' && !digitalSignature) {
      alert('Please provide a digital signature');
      return;
    }
    
    if (signatureType === 'handwritten' && !handwrittenSignature) {
      alert('Please provide a handwritten signature');
      return;
    }
    
    setIsGenerating(true);
    
    // Generate barcode
    setTimeout(() => {
      if (barcodeRef.current) {
        try {
          JsBarcode(barcodeRef.current, formData.certificateNumber, {
            format: "CODE128",
            lineColor: "#000",
            width: 2,
            height: 60,
            displayValue: true,
            fontSize: 12,
            margin: 10
          });
        } catch (error) {
          console.error("Barcode generation error:", error);
        }
      }
      
      setShowCertificate(true);
      setIsGenerating(false);
    }, 1000);
  };

  const handleDownloadPDF = async () => {
    if (!certificateRef.current) return;
    
    try {
      setIsGenerating(true);
      
      // Create a clone of the certificate node to avoid styling issues during capture
      const node = certificateRef.current;
      const clone = node.cloneNode(true);
      clone.style.width = `${node.offsetWidth}px`;
      clone.style.height = `${node.offsetHeight}px`;
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      document.body.appendChild(clone);
      
      const canvas = await html2canvas(clone, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: null
      });
      
      document.body.removeChild(clone);
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
      const imgWidthFinal = imgWidth * ratio;
      const imgHeightFinal = imgHeight * ratio;
      
      pdf.addImage(imgData, 'PNG', 
        (pageWidth - imgWidthFinal) / 2, 
        (pageHeight - imgHeightFinal) / 2,
        imgWidthFinal,
        imgHeightFinal
      );
      
      pdf.save(`certificate-${formData.certificateNumber}.pdf`);
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setShowCertificate(false);
    setFormData({
      name: '',
      enrollmentDate: '',
      endDate: '',
      signature: '',
      certificateNumber: 'CERT-' + Math.floor(10000 + Math.random() * 90000)
    });
    setDigitalSignature('');
    setHandwrittenSignature(null);
    clearSignatureCanvas();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-indigo-900 mb-8">
          Advanced Certificate Generator
        </h1>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Input Form */}
          <div className="w-full lg:w-2/5 bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-semibold text-indigo-800 mb-6">Enter Certificate Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter recipient's name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Date *</label>
                <input
                  type="date"
                  name="enrollmentDate"
                  value={formData.enrollmentDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Completion Date *</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Signature Type</label>
                <div className="flex space-x-4 mb-4">
                  <button
                    onClick={() => handleSignatureTypeChange('digital')}
                    className={`px-4 py-2 rounded-md ${
                      signatureType === 'digital' 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Digital Signature
                  </button>
                  <button
                    onClick={() => handleSignatureTypeChange('handwritten')}
                    className={`px-4 py-2 rounded-md ${
                      signatureType === 'handwritten' 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Handwritten
                  </button>
                </div>
                
                {signatureType === 'digital' ? (
                  <div>
                    <input
                      type="text"
                      value={digitalSignature}
                      onChange={(e) => setDigitalSignature(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter authorized signature"
                    />
                  </div>
                ) : (
                  <div>
                    <div 
                      className="border border-gray-300 rounded-md p-2 bg-white cursor-crosshair"
                      style={{touchAction: 'none'}}
                    >
                      <canvas
                        ref={signatureCanvasRef}
                        width={400}
                        height={150}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          startDrawing(e.touches[0]);
                        }}
                        onTouchMove={(e) => {
                          e.preventDefault();
                          draw(e.touches[0]);
                        }}
                        onTouchEnd={stopDrawing}
                        className="border border-dashed border-gray-400"
                      />
                    </div>
                    <button
                      onClick={clearSignatureCanvas}
                      className="mt-2 text-sm text-red-600 hover:text-red-800"
                    >
                      Clear Signature
                    </button>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Number</label>
                <input
                  type="text"
                  name="certificateNumber"
                  value={formData.certificateNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-100"
                  readOnly
                />
              </div>
              
              <div className="pt-4">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                >
                  {isGenerating ? (
                    <span>Generating Certificate...</span>
                  ) : (
                    <span>Generate Certificate</span>
                  )}
                </button>
                
                {showCertificate && (
                  <button
                    onClick={handleReset}
                    className="w-full mt-3 bg-gray-500 text-white py-3 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                  >
                    Create New Certificate
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Certificate Preview */}
          <div className="w-full lg:w-3/5">
            {showCertificate ? (
              <div className="relative" ref={certificateRef}>
                <div className="bg-gradient-to-br from-amber-50 via-white to-amber-50 rounded-xl shadow-2xl overflow-hidden border-8 border-amber-200 p-6 md:p-10">
                  {/* Decorative elements */}
                  <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-amber-400"></div>
                  <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-amber-400"></div>
                  <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-amber-400"></div>
                  <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-amber-400"></div>
                  
                  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 to-amber-600"></div>
                  <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 to-amber-600"></div>
                  
                  <div className="absolute inset-0 opacity-10 pointer-events-none" 
                       style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath fill='%23d97706' d='M50,10 L60,40 L90,40 L65,60 L75,90 L50,70 L25,90 L35,60 L10,40 L40,40 Z'/%3E%3C/svg%3E")`}}>
                  </div>
                  
                  {/* Security features */}
                  <div className="absolute top-10 left-10 w-24 h-24 rounded-full border-4 border-dashed border-amber-300 opacity-50"></div>
                  <div className="absolute bottom-10 right-10 w-24 h-24 rounded-full border-4 border-dashed border-amber-300 opacity-50"></div>
                  
                  <div className="absolute top-1/2 left-1/4 text-amber-200 font-bold text-6xl opacity-30 rotate-45">VALID</div>
                  <div className="absolute bottom-1/4 right-1/4 text-amber-200 font-bold text-6xl opacity-30 -rotate-45">OFFICIAL</div>
                  
                  {/* Barcode */}
                  <div className="absolute bottom-8 left-8 bg-white p-2 rounded-lg border border-gray-300 shadow-md">
                    <svg ref={barcodeRef} className="w-32 h-16"></svg>
                  </div>
                  
                  {/* Certificate content */}
                  <div className="relative z-10 text-center">
                    <h1 className="text-3xl md:text-4xl font-bold text-amber-800 mb-2">
                      CERTIFICATE OF COMPLETION
                    </h1>
                    <p className="text-gray-600 mb-8">
                      This certifies that
                    </p>

                    <div className="my-8">
                      <h2 className="text-3xl md:text-4xl font-semibold text-amber-700">
                        {formData.name}
                      </h2>
                    </div>

                    <p className="text-gray-700 text-lg mb-6">
                      has successfully completed the <span className="font-bold text-blue-800">React.js Web Developer Certification</span> program
                    </p>

                    <div className="my-10">
                      <div className="inline-block bg-gradient-to-r from-amber-500 to-amber-700 text-white py-3 px-8 rounded-full shadow-lg mb-4">
                        <span className="font-bold tracking-wider">PROFESSIONAL LEVEL</span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold text-blue-900 mt-4">
                        Certified React Web Developer
                      </h3>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center my-8 text-sm text-gray-600">
                      <div>Enrolled: {formData.enrollmentDate}</div>
                      <div>Completed: {formData.endDate}</div>
                    </div>

                    <div className="my-10 p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-sm text-gray-600 mb-1">Verify this certificate at:</p>
                      <a href="#" className="text-blue-600 hover:underline text-sm">
                        https://verify.example.com/{formData.certificateNumber}
                      </a>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center mt-16">
                      <div className="mb-8 md:mb-0">
                        <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-white font-bold border-4 border-white shadow-md bg-gradient-to-br from-amber-500 to-amber-700">
                          Seal
                        </div>
                      </div>
                      
                      <div className="text-center md:text-right">
                        {signatureType === 'digital' ? (
                          <div className="font-signature text-3xl text-indigo-900 mb-2">
                            {digitalSignature}
                          </div>
                        ) : (
                          <img 
                            src={handwrittenSignature} 
                            alt="Signature" 
                            className="h-12 mb-2 mx-auto md:mx-0 md:ml-auto"
                          />
                        )}
                        <div className="h-1 w-48 bg-gray-700 mx-auto md:mx-0 md:ml-auto mb-2"></div>
                        <p className="font-bold text-gray-800">Authorized Signatory</p>
                        <p className="text-sm text-gray-600">React.js Academy</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Download buttons */}
                <div className="mt-6 flex justify-center space-x-4">
                  <button
                    onClick={handleDownloadPDF}
                    disabled={isGenerating}
                    className="bg-red-600 hover:bg-red-700 text-white py-2 px-6 rounded-md flex items-center disabled:opacity-50"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    {isGenerating ? 'Generating PDF...' : 'Download PDF'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                <div className="text-center p-8 text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <p>Your certificate will appear here after generation</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateGenerator;