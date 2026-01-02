require "json"

Pod::Spec.new do |s|
  s.name         = "BarometerModule"
  s.version      = "0.1.0"
  s.summary      = "Native Barometer Module for Descendant"
  s.homepage     = "https://github.com/descendant/barometer"
  s.license      = "MIT"
  s.authors      = { "Descendant" => "dev@descendant.com" }
  s.platform     = :ios, "13.4"
  s.source       = { :path => "." }
  s.source_files = "*.{h,m}"
  s.requires_arc = true
  
  s.dependency "React-Core"
end
