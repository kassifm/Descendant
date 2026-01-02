#import "BarometerModule.h"
#import <CoreMotion/CoreMotion.h>

@implementation BarometerModule
{
  CMAltimeter *_altimeter;
}

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"BarometerEvent"];
}

RCT_EXPORT_METHOD(start:(NSInteger)intervalMs resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  if (![CMAltimeter isRelativeAltitudeAvailable]) {
    reject(@"NO_SENSOR", @"Barometer not available on this device", nil);
    return;
  }

  if (!_altimeter) {
    _altimeter = [[CMAltimeter alloc] init];
  }

  __weak typeof(self) weakSelf = self;
  [_altimeter startRelativeAltitudeUpdatesToQueue:[NSOperationQueue mainQueue] withHandler:^(CMAltitudeData * _Nullable altitudeData, NSError * _Nullable error) {
    if (error) {
      return;
    }
    
    if (altitudeData) {
      double pressureHPa = [altitudeData.pressure doubleValue] * 10.0;
      double timestamp = [[NSDate date] timeIntervalSince1970] * 1000;
      
      [weakSelf sendEventWithName:@"BarometerEvent" body:@{
        @"pressure": @(pressureHPa),
        @"timestamp": @(timestamp),
        @"type": @"pressure"
      }];
    }
  }];

  resolve(nil);
}

RCT_EXPORT_METHOD(stop:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  if (_altimeter) {
    [_altimeter stopRelativeAltitudeUpdates];
  }
  resolve(nil);
}

@end
