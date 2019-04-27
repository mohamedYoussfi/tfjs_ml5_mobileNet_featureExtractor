import {AfterViewInit, Component, ElementRef, NgZone, OnInit, ViewChild} from '@angular/core';
declare let ml5:any;
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit{
  @ViewChild('video')
  public video : ElementRef;
  @ViewChild('capture')
  public captureCanvas : ElementRef;
  public mobileNetFeatureExtreactor;
  public featureClassifier;
  imageLabel: string;
  public captures=[];
  public outputLabel;
  private confidence: number;
  currentProgress: number=0;
  private currentLoss: number;

  constructor(private ngZone:NgZone){}

  ngOnInit(): void {
    this.mobileNetFeatureExtreactor=ml5.featureExtractor('MobileNet',()=>{
      this.featureClassifier=this.mobileNetFeatureExtreactor.classification(this.video.nativeElement,()=>{
        console.log(this.featureClassifier);
      });
    });
  }
  ngAfterViewInit(): void {
    if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia){
      navigator.mediaDevices.getUserMedia({video:true})
        .then(stream=>{
          this.video.nativeElement.srcObject=stream;
          this.video.nativeElement.play();
        })
    }
  }

  addImage() {
    this.featureClassifier.addImage(this.imageLabel);
    this.capture();
  }

  private capture() {
    let context=this.captureCanvas.nativeElement.getContext('2d').drawImage(this.video.nativeElement,0,0,320,240);
    this.captures.push(this.captureCanvas.nativeElement.toDataURL('image/png'));
  }

  trainModel() {
    this.featureClassifier.train((loss)=>{
      if(loss==null){
        this.mobileNetFeatureExtreactor.classify((e,r)=>{
          this.getResults(e,r);
        });
      }
      else{
        this.ngZone.run(()=>{
          this.currentLoss=loss;
          ++this.currentProgress;
        });
        console.log(loss);
      }
    });
  }

  private getResults(err: any, results: any) {
    if(err){
      console.log(err);
    }
    else{
      this.ngZone.run(()=>{
        this.outputLabel=results[0].label;
        this.confidence=results[0].confidence;
      });

    }
    this.mobileNetFeatureExtreactor.classify((e,r)=>{
      this.getResults(e,r);
    })
  }
}
